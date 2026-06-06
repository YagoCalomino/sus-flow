'use client'

// components/nurse/VitalsGrid.tsx
// 2-column vitals input grid wired to React Hook Form.
// All vitals fields are optional — no required asterisk on these fields.
// AVPU is rendered as a shadcn Select (base-ui/react/select) via setValue/watch pattern.

import type {
  UseFormRegister,
  FieldErrors,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form'
import type { TriageFormInput } from '@/lib/schemas/triage'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

interface VitalsGridProps {
  register: UseFormRegister<TriageFormInput>
  errors: FieldErrors<TriageFormInput>
  setValue: UseFormSetValue<TriageFormInput>
  watch: UseFormWatch<TriageFormInput>
}

const AVPU_OPTIONS = [
  { value: 'alerta', label: 'Alerta' },
  { value: 'voz',    label: 'Resposta à Voz' },
  { value: 'dor',    label: 'Resposta à Dor' },
  { value: 'sem-resposta', label: 'Sem Resposta' },
] as const

export function VitalsGrid({ register, errors, setValue, watch }: VitalsGridProps) {
  const avpuValue = watch('avpu') ?? null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Dor (painScore) */}
      <div>
        <Label htmlFor="painScore" className="mb-1.5 block">
          Dor
          <span className="ml-1 text-xs text-muted-foreground font-normal">/10</span>
        </Label>
        <Input
          id="painScore"
          type="number"
          min={0}
          max={10}
          step={1}
          placeholder="0 – 10"
          {...register('painScore', { valueAsNumber: true })}
        />
        {errors.painScore && (
          <p className="text-xs text-destructive mt-1">{errors.painScore.message}</p>
        )}
      </div>

      {/* SpO2 (spo2) */}
      <div>
        <Label htmlFor="spo2" className="mb-1.5 block">
          SpO2
          <span className="ml-1 text-xs text-muted-foreground font-normal">%</span>
        </Label>
        <Input
          id="spo2"
          type="number"
          min={70}
          max={100}
          step={1}
          placeholder="70 – 100"
          {...register('spo2', { valueAsNumber: true })}
        />
        {errors.spo2 && (
          <p className="text-xs text-destructive mt-1">{errors.spo2.message}</p>
        )}
      </div>

      {/* FC (heartRate) */}
      <div>
        <Label htmlFor="heartRate" className="mb-1.5 block">
          Frequência Cardíaca
          <span className="ml-1 text-xs text-muted-foreground font-normal">bpm</span>
        </Label>
        <Input
          id="heartRate"
          type="number"
          min={20}
          max={300}
          step={1}
          placeholder="20 – 300"
          {...register('heartRate', { valueAsNumber: true })}
        />
        {errors.heartRate && (
          <p className="text-xs text-destructive mt-1">{errors.heartRate.message}</p>
        )}
      </div>

      {/* FR (respiratoryRate) */}
      <div>
        <Label htmlFor="respiratoryRate" className="mb-1.5 block">
          Frequência Respiratória
          <span className="ml-1 text-xs text-muted-foreground font-normal">rpm</span>
        </Label>
        <Input
          id="respiratoryRate"
          type="number"
          min={1}
          max={60}
          step={1}
          placeholder="1 – 60"
          {...register('respiratoryRate', {
            setValueAs: (v: unknown) => (v === '' || isNaN(Number(v)) ? null : Number(v)),
          })}
        />
        {errors.respiratoryRate && (
          <p className="text-xs text-destructive mt-1">{errors.respiratoryRate.message}</p>
        )}
      </div>

      {/* Temperatura */}
      <div>
        <Label htmlFor="temperature" className="mb-1.5 block">
          Temperatura
          <span className="ml-1 text-xs text-muted-foreground font-normal">°C</span>
        </Label>
        <Input
          id="temperature"
          type="number"
          min={30}
          max={45}
          step={0.1}
          placeholder="30.0 – 45.0"
          {...register('temperature', { valueAsNumber: true })}
        />
        {errors.temperature && (
          <p className="text-xs text-destructive mt-1">{errors.temperature.message}</p>
        )}
      </div>

      {/* AVPU (consciousness) — controlled via setValue/watch */}
      <div>
        <Label htmlFor="avpu-trigger" className="mb-1.5 block">
          Nível de Consciência (AVPU)
        </Label>
        <Select
          value={avpuValue ?? ''}
          onValueChange={(val) => {
            if (val === '__clear__') {
              setValue('avpu', null)
            } else {
              setValue('avpu', val as TriageFormInput['avpu'])
            }
          }}
        >
          <SelectTrigger id="avpu-trigger" className="w-full">
            <SelectValue placeholder="Selecione o nível" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__clear__">Não informado</SelectItem>
            {AVPU_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.avpu && (
          <p className="text-xs text-destructive mt-1">{errors.avpu.message}</p>
        )}
      </div>
    </div>
  )
}
