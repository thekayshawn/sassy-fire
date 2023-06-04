import { User } from "firebase/auth";
import { BoolBacks } from "@sassy-js/utils";

export type { User };

export type LoginProps = BoolBacks<User>;

export type LogoutProps = BoolBacks<void>;
