export interface UserInfo {
  id: number;
  username: string;
  role_id: number;
  role_name: string;
  teacher_id?: number;
}

export interface LoginResponse {
  token: string;
  user_id: number;
  username: string;
  role_id: number;
  role_name: string;
  teacher_id?: number;
}

export interface ApiResponse<T> {
  code: number;
  msg: string;
  data: T;
}

export interface PageData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: number;
  teacher_no: string;
  name: string;
  gender: string;
  phone: string;
  email: string;
  department: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  role_id: number;
  teacher_id?: number;
  status: number;
  role?: Role;
  teacher?: Teacher;
  created_at: string;
  updated_at: string;
}

export interface MaterialType {
  id: number;
  name: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: number;
  name: string;
  code: string;
  type_id: number;
  unit: string;
  description: string;
  status: number;
  type?: MaterialType;
  stocks?: Stock[];
  created_at: string;
  updated_at: string;
}

export interface Stock {
  id: number;
  material_id: number;
  quantity: number;
  min_stock: number;
  max_stock: number;
  location: string;
  material?: Material;
  created_at: string;
  updated_at: string;
}

export interface InventoryIn {
  id: number;
  material_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  supplier: string;
  batch_no: string;
  remark: string;
  operator_id: number;
  material?: Material;
  operator?: User;
  created_at: string;
  updated_at: string;
}

export interface InventoryOut {
  id: number;
  material_id: number;
  quantity: number;
  remark: string;
  operator_id: number;
  material?: Material;
  operator?: User;
  created_at: string;
  updated_at: string;
}

export interface Claim {
  id: number;
  material_id: number;
  quantity: number;
  teacher_id: number;
  status: number;
  reason: string;
  remark: string;
  operator_id?: number;
  material?: Material;
  teacher?: Teacher;
  operator?: User;
  created_at: string;
  updated_at: string;
}

export interface InventoryInStatistics {
  total_quantity: number;
  total_amount: number;
  by_material: {
    material_id: number;
    material_name: string;
    quantity: number;
    amount: number;
  }[];
  by_month: {
    month: string;
    quantity: number;
    amount: number;
  }[];
}

export interface InventoryOutStatistics {
  total_quantity: number;
  by_material: {
    material_id: number;
    material_name: string;
    quantity: number;
  }[];
  by_month: {
    month: string;
    quantity: number;
  }[];
}

export interface MaterialTypeStatistics {
  type_name: string;
  count: number;
  quantity: number;
}

export interface Permission {
  id: number;
  name: string;
  code: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface Menu {
  id: number;
  name: string;
  parent_id: number;
  path: string;
  icon: string;
  sort: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions?: Permission[];
}
