import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'           // P1: Edge cannot hold setInterval reliably
export const dynamic = 'force-dynamic'    // P1: Prevent static caching

// Read pre-computed QueueMetrics — never aggregate live
async function fetchMetrics() {
  return prisma.queueMetrics.findMany({
    include: {
      facility: { select: { id: true, name: true, type: true, capacity: true } },
    },
    orderBy: { loadPercent: 'desc' },
  })
}

export async function GET(req: Request) {
  const encoder = new TextEncoder()

  // Hoist interval handles outside start() so cancel() can reference them
  let poll: ReturnType<typeof setInterval> | undefined
  let heartbeat: ReturnType<typeof setInterval> | undefined

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (chunk: string) =>
        controller.enqueue(encoder.encode(chunk))

      // Immediate snapshot on connect — don't wait for first interval
      try {
        const initial = await fetchMetrics()
        enqueue(`data: ${JSON.stringify(initial)}\n\n`)
      } catch {
        controller.close()
        return
      }

      // Poll every 5 seconds
      poll = setInterval(async () => {
        try {
          const metrics = await fetchMetrics()
          enqueue(`data: ${JSON.stringify(metrics)}\n\n`)
        } catch {
          // DB error — skip frame, keep connection alive
        }
      }, 5_000)

      // 25-second heartbeat to prevent proxy/Vercel timeout
      heartbeat = setInterval(() => {
        enqueue(': heartbeat\n\n')
      }, 25_000)

      // Cleanup both intervals on client disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(poll)
        clearInterval(heartbeat)
        controller.close()
      })
    },

    // cancel() fires when the consumer cancels the stream (e.g. fetch abort,
    // response body destroyed) — ensures intervals are always cleared even if
    // the abort signal never fires.
    cancel() {
      clearInterval(poll)
      clearInterval(heartbeat)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type':      'text/event-stream',
      'Cache-Control':     'no-cache, no-transform',
      'Connection':        'keep-alive',
      'X-Accel-Buffering': 'no',  // disable Nginx buffering on Vercel
    },
  })
}
