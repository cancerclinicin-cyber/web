import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface User {
  access_token: string;
  refresh_token: string;
  refresh_token_expires_at: string;
  email_address: string;
  phone_number: string;
  id: number;
  first_name: string;
  last_name: string;
  password: string | null;
  created_at: string;
  updated_at: string;
  password_digest: string;
}

interface AuthState {
  access_token: string | null;
  refresh_token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  access_token: null,
  refresh_token: null,
  user: null,
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{
        access_token: string;
        refresh_token: string;
        user: User;
      }>
    ) => {
      state.access_token = action.payload.access_token;
      state.refresh_token = action.payload.refresh_token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.access_token = null;
      state.refresh_token = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
