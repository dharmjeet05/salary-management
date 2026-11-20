'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import {
  COUNTRIES,
  DEPARTMENTS,
  createEmployeeSchema,
  jobTitlesForDepartment,
  type CreateEmployeeInput,
} from '@salary/shared'
import { useForm, useWatch } from 'react-hook-form'
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

// An empty box or "Pick a ..." means not filled in, so the shared schema says
// "Enter a name" rather than "Name must be at least 2 characters"
const notFilledIn = z
  .unknown()
  .transform((value) => (value === '' || Number.isNaN(value) ? undefined : value))

// The inputs hold whatever is typed or picked, and the shared schema decides
// what is valid. Same rules and messages as the api.
const employeeFormSchema = z
  .object({
    fullName: notFilledIn,
    email: notFilledIn,
    country: notFilledIn,
    department: notFilledIn,
    jobTitle: notFilledIn,
    annualSalary: notFilledIn,
    hireDate: notFilledIn,
  })
  .pipe(createEmployeeSchema)

type EmployeeFormValues = z.input<typeof employeeFormSchema>

function isFieldName(path: string): path is FieldName {
  return FIELD_NAMES.some((name) => name === path)
}

function findDepartment(value: unknown) {
  return DEPARTMENTS.find((department) => department.name === value)?.name
}

function findCountry(value: unknown) {
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
    defaultValues: defaultValues ?? {},
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

  function fieldProps(name: FieldName) {
    return { id: `employee-${name}`, 'aria-invalid': errors[name] ? true : undefined }
  }

  return (
    <form noValidate onSubmit={(event) => void submit(event)} className="max-w-xl space-y-6">
      <FieldGroup>
        <Field data-invalid={errors.fullName ? true : undefined}>
          <FieldLabel htmlFor="employee-fullName">Full name</FieldLabel>
          <Input {...fieldProps('fullName')} autoComplete="off" {...form.register('fullName')} />
          <FieldError errors={[errors.fullName]} />
        </Field>
        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor="employee-email">Email</FieldLabel>
          <Input
            {...fieldProps('email')}
            type="email"
            autoComplete="off"
            {...form.register('email')}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field data-invalid={errors.country ? true : undefined}>
            <FieldLabel htmlFor="employee-country">Country</FieldLabel>
            <NativeSelect {...fieldProps('country')} {...form.register('country')}>
              <NativeSelectOption value="">Pick a country</NativeSelectOption>
              {COUNTRIES.map((option) => (
                <NativeSelectOption key={option.code} value={option.code}>
                  {option.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError errors={[errors.country]} />
          </Field>
          <Field data-invalid={errors.annualSalary ? true : undefined}>
            <FieldLabel htmlFor="employee-annualSalary">
              {country ? `Annual salary (${country.currency})` : 'Annual salary'}
            </FieldLabel>
            <Input
              {...fieldProps('annualSalary')}
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              {...form.register('annualSalary', { valueAsNumber: true })}
            />
            <FieldError errors={[errors.annualSalary]} />
          </Field>
          <Field data-invalid={errors.department ? true : undefined}>
            <FieldLabel htmlFor="employee-department">Department</FieldLabel>
            <NativeSelect
              {...fieldProps('department')}
              {...form.register('department', {
                onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
                  // a job title from another department would never pass
                  const next = findDepartment(event.target.value)
                  const jobTitle = form.getValues('jobTitle')
                  const stillFits =
                    next !== undefined &&
                    jobTitlesForDepartment(next).some((title) => title === jobTitle)
                  if (!stillFits) form.setValue('jobTitle', '')
                },
              })}
            >
              <NativeSelectOption value="">Pick a department</NativeSelectOption>
              {DEPARTMENTS.map((option) => (
                <NativeSelectOption key={option.name} value={option.name}>
                  {option.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldError errors={[errors.department]} />
          </Field>
          <Field data-invalid={errors.jobTitle ? true : undefined}>
            <FieldLabel htmlFor="employee-jobTitle">Job title</FieldLabel>
            <NativeSelect
              {...fieldProps('jobTitle')}
              disabled={department === undefined}
              {...form.register('jobTitle')}
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
            <FieldError errors={[errors.jobTitle]} />
          </Field>
          <Field data-invalid={errors.hireDate ? true : undefined}>
            <FieldLabel htmlFor="employee-hireDate">Hire date</FieldLabel>
            <Input {...fieldProps('hireDate')} type="date" {...form.register('hireDate')} />
            <FieldError errors={[errors.hireDate]} />
          </Field>
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
