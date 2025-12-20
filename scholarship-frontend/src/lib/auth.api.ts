import api from "./api";

export interface LoginPayload {
  email: string;
  password: string;
}

export const loginApi = async (payload: LoginPayload) => {
  const res = await api.post("/auth/login", payload);
  return res.data;
};

export const signupApi = async (payload: {
  email: string;
  password: string;
}) => {
  const res = await api.post("/auth/register", payload);
  return res.data;
};

