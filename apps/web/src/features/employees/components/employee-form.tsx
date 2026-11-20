'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  COUNTRIES,
  DEPARTMENTS,
  createEmployeeSchema,
  jobTitlesForDepartment,
  type CreateEmployeeInput,
} from '@salary/shared'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { ApiError } from '@/lib/api-client'

const FIELD_NAMES = [
  'fullName',
  'email',
  'country',
  'department',
  'jobTitle',
  'annualSalary',
  'hireDate',
] as const

type FieldName = (typeof FIELD_NAMES)[number]

// What the inputs hold: text, always. An empty box or "Pick a ..." means not
// filled in, so the shared schema says "Enter a name" rather than "Name must
// be at least 2 characters".
const text = z.string().transform((value) => (value === '' ? undefined : value))
const amount = z.string().transform((value) => (value.trim() === '' ? undefined : Number(value)))

// The shared schema decides what is valid, with the same rules and messages
// as the api.
const employeeFormSchema = z
  .object({
    fullName: text,
    email: text,
    country: text,
    department: text,
    jobTitle: text,
    annualSalary: amount,
    hireDate: text,
  })
  .pipe(createEmployeeSchema)

type EmployeeFormValues = z.input<typeof employeeFormSchema>

function toFormValues(employee: Partial<CreateEmployeeInput> = {}): EmployeeFormValues {
  return {
    fullName: employee.fullName ?? '',
    email: employee.email ?? '',
    country: employee.country ?? '',
    department: employee.department ?? '',
    jobTitle: employee.jobTitle ?? '',
    annualSalary: employee.annualSalary === undefined ? '' : String(employee.annualSalary),
    hireDate: employee.hireDate ?? '',
  }
}

function isFieldName(path: string): path is FieldName {
  return FIELD_NAMES.some((name) => name === path)
}

function findDepartment(value: string) {
  return DEPARTMENTS.find((department) => department.name === value)?.name
}

function findCountry(value: string) {
  return COUNTRIES.find((country) => country.code === value)
}

type EmployeeFormProps = {
  defaultValues?: Partial<CreateEmployeeInput>
  submitLabel: string
  onSubmit: (values: CreateEmployeeInput) => Promise<unknown>
  children?: React.ReactNode
}

export function EmployeeForm({
  defaultValues,
  submitLabel,
  onSubmit,
  children,
}: EmployeeFormProps) {
  const form = useForm<EmployeeFormValues, unknown, CreateEmployeeInput>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: toFormValues(defaultValues),
  })
  const { errors, isSubmitting } = form.formState

  const country = findCountry(useWatch({ control: form.control, name: 'country' }))
  const department = findDepartment(useWatch({ control: form.control, name: 'department' }))
  const jobTitles = department ? jobTitlesForDepartment(department) : []

  const submit = form.handleSubmit(async (values) => {
    try {
      await onSubmit(values)
    } catch (error) {
      const fieldErrors =
        error instanceof ApiError ? error.details.filter((detail) => isFieldName(detail.path)) : []
      for (const detail of fieldErrors) {
        if (isFieldName(detail.path)) form.setError(detail.path, { message: detail.message })
      }
      if (fieldErrors.length === 0) {
        form.setError('root.server', {
          message: error instanceof ApiError ? error.message : 'Something went wrong. Try again.',
        })
      }
    }
  })

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="max-w-xl space-y-6">
      <FieldGroup>
        <Controller
          name="fullName"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Full name</FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                autoComplete="off"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>Email</FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="email"
                aria-invalid={fieldState.invalid}
                autoComplete="off"
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <Controller
            name="country"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Country</FieldLabel>
                <NativeSelect {...field} id={field.name} aria-invalid={fieldState.invalid}>
                  <NativeSelectOption value="">Pick a country</NativeSelectOption>
                  {COUNTRIES.map((option) => (
                    <NativeSelectOption key={option.code} value={option.code}>
                      {option.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="annualSalary"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  {country ? `Annual salary (${country.currency})` : 'Annual salary'}
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="number"
                  inputMode="numeric"
                  min={1}
                  step={1}
                  aria-invalid={fieldState.invalid}
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="department"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Department</FieldLabel>
                <NativeSelect
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  onChange={(event) => {
                    field.onChange(event)
                    // a job title from another department would never pass
                    const next = findDepartment(event.target.value)
                    const jobTitle = form.getValues('jobTitle')
                    const stillFits =
                      next !== undefined &&
                      jobTitlesForDepartment(next).some((title) => title === jobTitle)
                    if (!stillFits) form.setValue('jobTitle', '')
                  }}
                >
                  <NativeSelectOption value="">Pick a department</NativeSelectOption>
                  {DEPARTMENTS.map((option) => (
                    <NativeSelectOption key={option.name} value={option.name}>
                      {option.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="jobTitle"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Job title</FieldLabel>
                <NativeSelect
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  disabled={department === undefined}
                >
                  <NativeSelectOption value="">
                    {department ? 'Pick a job title' : 'Pick a department first'}
                  </NativeSelectOption>
                  {jobTitles.map((title) => (
                    <NativeSelectOption key={title} value={title}>
                      {title}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="hireDate"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Hire date</FieldLabel>
                <Input {...field} id={field.name} type="date" aria-invalid={fieldState.invalid} />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>
      </FieldGroup>

      {errors.root?.server ? (
        <p role="alert" className="text-destructive text-sm">
          {errors.root.server.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
        {children}
      </div>
    </form>
  )
}
