export type UserSummary = {
  user_id: number;
  name: string;
  position: string;
  company_id: number;
  department_id?: number;
  unit_id?: number;
};

export type LoginCredentials = {
  username: string;
  password: string;
  rememberMe: boolean;
};

export interface RegisterCredentials {
  employee_id: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  email: string;
  // role_id: number;
  // alias?: string;
  company_id: number;
  department_id?: number;
  unit_id?: number;
  position: string;
  type_id: number;
  classification_id: number;
}
