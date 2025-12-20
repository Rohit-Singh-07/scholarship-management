"use client";

import { useAppDispatch, useAppSelector } from "@/src/store/hooks";
import { signup } from "@/src/store/slices/auth.slice";
import { useForm } from "react-hook-form";

interface SignupForm {
  name: string;
  email: string;
  password: string;
}

export default function SignupPage() {
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector((s) => s.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>();

  const onSubmit = (data: SignupForm) => {
    dispatch(signup(data));
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", marginTop: 80 }}>
      <h1>Sign Up</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          placeholder="Full Name"
          {...register("name", { required: true })}
        />
        {errors.name && <p>Name is required</p>}

        <input
          placeholder="Email"
          {...register("email", { required: true })}
        />
        {errors.email && <p>Email is required</p>}

        <input
          type="password"
          placeholder="Password"
          {...register("password", { required: true, minLength: 6 })}
        />
        {errors.password && <p>Password min 6 chars</p>}

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
}
