import request from '../utils/request';
import { 
  UserInfo, 
  LoginResponse, 
  PageData, 
  User, 
  Teacher, 
  Material, 
  MaterialType,
  Stock,
  InventoryIn,
  InventoryOut,
  Claim,
  InventoryInStatistics,
  InventoryOutStatistics,
  MaterialTypeStatistics,
  Role,
  Permission,
  Menu,
  RoleWithPermissions
} from '../types';

export const login = (username: string, password: string) => {
  return request.post<LoginResponse>('/login', { username, password });
};

export const getUserInfo = () => {
  return request.get<UserInfo>('/user/info');
};

export const getUsers = (params?: {
  page?: number;
  pageSize?: number;
  username?: string;
  status?: number;
}) => {
  return request.get<PageData<User>>('/users', { params });
};

export const getUser = (id: number) => {
  return request.get<User>(`/users/${id}`);
};

export const createUser = (data: Partial<User>) => {
  return request.post<User>('/users', data);
};

export const updateUser = (id: number, data: Partial<User>) => {
  return request.put<User>(`/users/${id}`, data);
};

export const deleteUser = (id: number) => {
  return request.delete(`/users/${id}`);
};

export const resetPassword = (id: number, password: string) => {
  return request.put(`/users/${id}/password`, { password });
};

export const getTeachers = (params?: {
  page?: number;
  pageSize?: number;
  name?: string;
  teacher_no?: string;
  department?: string;
  status?: number;
}) => {
  return request.get<PageData<Teacher>>('/teachers', { params });
};

export const getTeacher = (id: number) => {
  return request.get<Teacher>(`/teachers/${id}`);
};

export const createTeacher = (data: Partial<Teacher>) => {
  return request.post<Teacher>('/teachers', data);
};

export const updateTeacher = (id: number, data: Partial<Teacher>) => {
  return request.put<Teacher>(`/teachers/${id}`, data);
};

export const deleteTeacher = (id: number) => {
  return request.delete(`/teachers/${id}`);
};

export const getRoles = () => {
  return request.get<PageData<Role>>('/roles', { params: { page: 1, pageSize: 100 } });
};

export const getMaterialTypes = () => {
  return request.get<MaterialType[]>('/material-types');
};

export const getMaterialType = (id: number) => {
  return request.get<MaterialType>(`/material-types/${id}`);
};

export const createMaterialType = (data: Partial<MaterialType>) => {
  return request.post<MaterialType>('/material-types', data);
};

export const updateMaterialType = (id: number, data: Partial<MaterialType>) => {
  return request.put<MaterialType>(`/material-types/${id}`, data);
};

export const deleteMaterialType = (id: number) => {
  return request.delete(`/material-types/${id}`);
};

export const getMaterials = (params?: {
  page?: number;
  pageSize?: number;
  name?: string;
  code?: string;
  type_id?: number;
  status?: number;
}) => {
  return request.get<PageData<Material>>('/materials', { params });
};

export const getMaterial = (id: number) => {
  return request.get<Material>(`/materials/${id}`);
};

export const createMaterial = (data: Partial<Material>) => {
  return request.post<Material>('/materials', data);
};

export const updateMaterial = (id: number, data: Partial<Material>) => {
  return request.put<Material>(`/materials/${id}`, data);
};

export const deleteMaterial = (id: number) => {
  return request.delete(`/materials/${id}`);
};

export const getStocks = (params?: {
  page?: number;
  pageSize?: number;
  material_name?: string;
}) => {
  return request.get<PageData<Stock>>('/stocks', { params });
};

export const getStock = (id: number) => {
  return request.get<Stock>(`/stocks/${id}`);
};

export const getInventoryInList = (params?: {
  page?: number;
  pageSize?: number;
  material_name?: string;
  supplier?: string;
  start_date?: string;
  end_date?: string;
}) => {
  return request.get<PageData<InventoryIn>>('/inventory-in', { params });
};

export const createInventoryIn = (data: Partial<InventoryIn>) => {
  return request.post<InventoryIn>('/inventory-in', data);
};

export const getInventoryOutList = (params?: {
  page?: number;
  pageSize?: number;
  material_name?: string;
  start_date?: string;
  end_date?: string;
}) => {
  return request.get<PageData<InventoryOut>>('/inventory-out', { params });
};

export const createInventoryOut = (data: Partial<InventoryOut>) => {
  return request.post<InventoryOut>('/inventory-out', data);
};

export const getClaims = (params?: {
  page?: number;
  pageSize?: number;
  material_name?: string;
  teacher_name?: string;
  status?: number;
  start_date?: string;
  end_date?: string;
}) => {
  return request.get<PageData<Claim>>('/claims', { params });
};

export const updateClaimStatus = (id: number, status: number, remark?: string) => {
  return request.put(`/claims/${id}/status`, { status, remark });
};

export const getTeacherMaterials = (params?: {
  page?: number;
  pageSize?: number;
  name?: string;
  type_id?: number;
}) => {
  return request.get<PageData<Material>>('/teacher/materials', { params });
};

export const createClaim = (data: Partial<Claim>) => {
  return request.post<Claim>('/teacher/claims', data);
};

export const getTeacherClaims = (params?: {
  page?: number;
  pageSize?: number;
  material_name?: string;
  status?: number;
  start_date?: string;
  end_date?: string;
}) => {
  return request.get<PageData<Claim>>('/teacher/claims', { params });
};

export const getInventoryInStatistics = (params?: {
  start_date?: string;
  end_date?: string;
}) => {
  return request.get<InventoryInStatistics>('/statistics/inventory-in', { params });
};

export const getInventoryOutStatistics = (params?: {
  start_date?: string;
  end_date?: string;
}) => {
  return request.get<InventoryOutStatistics>('/statistics/inventory-out', { params });
};

export const getMaterialTypeStatistics = () => {
  return request.get<MaterialTypeStatistics[]>('/statistics/material-type');
};

export const getPermissions = () => {
  return request.get<Permission[]>('/permissions', { params: { page: 1, pageSize: 100 } });
};

export const createRole = (data: Partial<RoleWithPermissions>) => {
  return request.post<Role>('/roles', data);
};

export const updateRole = (id: number, data: Partial<RoleWithPermissions>) => {
  return request.put<Role>(`/roles/${id}`, data);
};

export const deleteRole = (id: number) => {
  return request.delete(`/roles/${id}`);
};

export const getMenus = () => {
  return request.get<Menu[]>('/menus');
};

export const createMenu = (data: Partial<Menu>) => {
  return request.post<Menu>('/menus', data);
};

export const updateMenu = (id: number, data: Partial<Menu>) => {
  return request.put<Menu>(`/menus/${id}`, data);
};

export const deleteMenu = (id: number) => {
  return request.delete(`/menus/${id}`);
};
