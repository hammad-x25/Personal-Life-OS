import { configureStore, createSlice } from '@reduxjs/toolkit';
const auth = createSlice({ name: 'auth', initialState: { user: null }, reducers: { setUser: (s, a) => { s.user = a.payload; }, clearUser: s => { s.user = null; } } });
const access = createSlice({ name: 'access', initialState: { status: null }, reducers: { setAccess: (s, a) => { s.status = a.payload; } } });
export const { setUser, clearUser } = auth.actions; export const { setAccess } = access.actions;
export const store = configureStore({ reducer: { auth: auth.reducer, access: access.reducer } });
