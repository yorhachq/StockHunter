export type FormFieldErrors = Record<string, string[]>;

export interface ActionFormState {
  success: boolean;
  message: string;
  fieldErrors: FormFieldErrors;
  formErrors: string[];
}

export const initialActionFormState: ActionFormState = {
  success: false,
  message: "",
  fieldErrors: {},
  formErrors: [],
};
