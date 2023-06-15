import { User } from "firebase/auth";
import { BoolBacks } from "@sassy-js/utils";

export type { User };

export type LoginProps = Partial<BoolBacks<User>> & {
  provider?: "anonymous" | "email" | "google";
  email?: string;
  password?: string;
};

export type LogoutProps = Partial<BoolBacks<void>>;
