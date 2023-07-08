import { User } from "firebase/auth";
import { BoolBacks } from "@sassy-js/utils";

export type { User };

export type AuthProvider = "anonymous" | "email" | "google";

export type LoginProps = Partial<BoolBacks<User>> & {
  email?: string;
  password?: string;
  provider?: AuthProvider;
};

export type RegisterProps = Omit<LoginProps, "provider"> & {
  provider: Omit<AuthProvider, "anonymous">;
};

export type LogoutProps = Partial<BoolBacks<void>>;
