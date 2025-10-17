export type LoginCredentials = {
  username: string;
  email_address: string;
  password: string;
};

export interface RegisterCredentials extends LoginCredentials {
  employee_no: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  role_id: number;
  alias?: string;
  company_id: number;
  department_id?: number;
  unit_id?: number;
  position: string;
  type_id: number;
  classification_id: number;
}
