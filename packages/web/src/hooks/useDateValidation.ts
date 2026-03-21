import { ValidationRule } from "./useFormValidation";

export const createDateValidators = (messages: {
  required: string;
  endBeforeStart?: string;
}) => {
  return {
    startDate: {
      required: messages.required,
    } as ValidationRule<Date | null>,
    endDate: {
      required: messages.required,
      custom: {
        validator: (value: Date | null) => value !== null,
        message: messages.required,
      },
    } as ValidationRule<Date | null>,
  };
};

export const createDateRangeValidator = (
  startDate: Date | null,
  endDate: Date | null,
  errorMessage: string,
): ValidationRule<Date | null> => ({
  validate: (value: Date | null) => {
    if (value && startDate && value < startDate) {
      return errorMessage;
    }
    return undefined;
  },
});
