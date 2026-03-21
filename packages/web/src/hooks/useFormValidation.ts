import { useState, useCallback, useMemo, useRef } from "react";

export type ValidationRule<T> = {
  required?: string;
  maxLength?: { value: number; message: string };
  minLength?: { value: number; message: string };
  validate?: (value: T) => string | undefined;
  custom?: {
    validator: (value: T) => boolean;
    message: string;
  };
};

export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

export type CrossFieldValidator<T> = (values: T) => ValidationErrors<T>;

export interface UseFormValidationOptions<T> {
  rules: ValidationRules<T>;
  initialValues?: Partial<T>;
  crossFieldValidate?: CrossFieldValidator<T>;
}

export interface UseFormValidationReturn<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: Record<string, boolean>;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setFieldTouched: (field: string) => void;
  validate: () => boolean;
  validateAll: () => boolean;
  validateField: <K extends keyof T>(field: K) => string | undefined;
  reset: (newValues?: Partial<T>) => void;
  isValid: boolean;
  isDirty: boolean;
}

export function useFormValidation<T extends Record<string, any>>(
  options: UseFormValidationOptions<T>,
): UseFormValidationReturn<T> {
  const { rules, initialValues, crossFieldValidate } = options;

  const [values, setValuesState] = useState<T>(() => {
    const defaultValues: T = {} as T;
    Object.keys(rules).forEach((key) => {
      (defaultValues as any)[key] = initialValues?.[key as keyof T] ?? "";
    });
    return defaultValues;
  });

  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const valuesRef = useRef(values);
  const errorsRef = useRef(errors);
  valuesRef.current = values;
  errorsRef.current = errors;

  const validateFieldValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]): string | undefined => {
      const fieldRules = rules[field];
      if (!fieldRules) return undefined;

      if (fieldRules.required !== undefined) {
        const isEmpty =
          value === null ||
          value === undefined ||
          value === "" ||
          (typeof value === "string" && value.trim() === "");
        if (isEmpty) return fieldRules.required;
      }

      if (typeof value === "string") {
        if (fieldRules.maxLength && value.length > fieldRules.maxLength.value) {
          return fieldRules.maxLength.message;
        }
        if (fieldRules.minLength && value.length < fieldRules.minLength.value) {
          return fieldRules.minLength.message;
        }
      }

      if (fieldRules.validate) {
        const customError = fieldRules.validate(value);
        if (customError) return customError;
      }

      if (fieldRules.custom) {
        if (!fieldRules.custom.validator(value)) {
          return fieldRules.custom.message;
        }
      }

      return undefined;
    },
    [rules],
  );

  const validate = useCallback((): boolean => {
    const currentValues = valuesRef.current;
    const newErrors: ValidationErrors<T> = {};
    let isValid = true;

    Object.keys(rules).forEach((key) => {
      const error = validateFieldValue(
        key as keyof T,
        currentValues[key as keyof T],
      );
      if (error) {
        newErrors[key as keyof T] = error;
        isValid = false;
      }
    });

    if (crossFieldValidate) {
      const crossFieldErrors = crossFieldValidate(currentValues);
      Object.keys(crossFieldErrors).forEach((key) => {
        newErrors[key as keyof T] = crossFieldErrors[key as keyof T];
        isValid = false;
      });
    }

    setErrors(newErrors);
    setSubmitted(true);
    return isValid;
  }, [rules, validateFieldValue, crossFieldValidate]);

  const validateAll = useCallback(() => {
    const allTouched: Record<string, boolean> = {};
    Object.keys(rules).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    return validate();
  }, [rules, validate]);

  const validateField = useCallback(
    <K extends keyof T>(field: K): string | undefined => {
      const error = validateFieldValue(field, valuesRef.current[field]);
      setErrors((prev) => {
        const newErrors = { ...prev };
        if (error) {
          (newErrors as any)[field] = error;
        } else {
          delete (newErrors as any)[field];
        }
        return newErrors;
      });
      return error;
    },
    [validateFieldValue],
  );

  const setValue = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      const currentValues = valuesRef.current;
      const newValues = { ...currentValues, [field]: value };
      setValuesState(newValues);
      valuesRef.current = newValues;

      const newErrors: ValidationErrors<T> = {};

      if (touched[field as string]) {
        const error = validateFieldValue(field, value);
        if (error) {
          (newErrors as any)[field] = error;
        }
      }

      if (crossFieldValidate) {
        const crossErrors = crossFieldValidate(newValues);
        Object.keys(crossErrors).forEach((key) => {
          (newErrors as any)[key] = crossErrors[key as keyof T];
        });
      }

      if (
        Object.keys(newErrors).length > 0 ||
        Object.keys(errorsRef.current).length > 0
      ) {
        setErrors((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((key) => {
            if (!(key in newErrors)) {
              delete updated[key as keyof T];
            }
          });
          return { ...updated, ...newErrors };
        });
      }
    },
    [touched, validateFieldValue, crossFieldValidate],
  );

  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState((prev) => {
      const updated = { ...prev, ...newValues };
      valuesRef.current = updated;
      return updated;
    });
  }, []);

  const setFieldTouched = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      validateField(field as keyof T);
    },
    [validateField],
  );

  const reset = useCallback(
    (newValues?: Partial<T>) => {
      if (newValues) {
        setValuesState((prev) => {
          const updated = { ...prev, ...newValues };
          valuesRef.current = updated;
          return updated;
        });
      } else {
        const defaultValues: T = {} as T;
        Object.keys(rules).forEach((key) => {
          (defaultValues as any)[key] = initialValues?.[key as keyof T] ?? "";
        });
        setValuesState(defaultValues);
        valuesRef.current = defaultValues;
      }
      setErrors({});
      setTouched({});
      setSubmitted(false);
    },
    [rules, initialValues],
  );

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const isDirty = useMemo(() => {
    return submitted && isValid;
  }, [submitted, isValid]);

  return {
    values,
    errors,
    touched,
    setValue,
    setValues,
    setFieldTouched,
    validate,
    validateAll,
    validateField,
    reset,
    isValid,
    isDirty,
  };
}
