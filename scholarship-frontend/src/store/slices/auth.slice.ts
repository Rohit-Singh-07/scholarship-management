import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { loginApi, signupApi } from "@/src/lib/auth.api";

export interface User {
  _id: string;
  email: string;
  role: "APPLICANT" | "ADMIN" | "SUPER_ADMIN";
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

/* ================= SIGNUP ================= */

export const signup = createAsyncThunk<
  void,
  { email: string; password: string },
  { rejectValue: string }
>("auth/signup", async (payload, { rejectWithValue }) => {
  try {
    await signupApi(payload);
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Signup failed"
    );
  }
});

/* ================= LOGIN ================= */

export const login = createAsyncThunk<
  { user: User; token: string },
  { email: string; password: string },
  { rejectValue: string }
>("auth/login", async (payload, { rejectWithValue }) => {
  try {
    const data = await loginApi(payload);

    if (typeof window !== "undefined") {
      localStorage.setItem("token", data.token);
    }

    return {
      user: data.user,
      token: data.token,
    };
  } catch (err: any) {
    return rejectWithValue(
      err.response?.data?.message || "Login failed"
    );
  }
});

/* ================= SLICE ================= */

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    },

    restoreSession(state, action) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // LOGIN
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Login failed";
      })

      // SIGNUP
      .addCase(signup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signup.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(signup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Signup failed";
      });
  },
});

export const { logout, restoreSession } = authSlice.actions;
export default authSlice.reducer;
