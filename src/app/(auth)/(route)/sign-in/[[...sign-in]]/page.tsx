"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import Link from "next/link";

const SignInPage = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-cover bg-center">
      <div className="w-full max-w-lg flex flex-col gap-4 p-8 backdrop-blur-lg bg-white/30 rounded-lg shadow-lg">
        <SignIn.Root>
          <Clerk.Connection
            name="google"
            className="bg-white bg-opacity-70 rounded-full p-2 text-black w-full flex items-center justify-center gap-2 font-bold mb-4"
          >
            <svg viewBox="0 0 24 24" width={24} height={24}>
              <path
                d="M18.977 4.322L16 7.3c-1.023-.838-2.326-1.35-3.768-1.35-2.69 0-4.95 1.73-5.74 4.152l-3.44-2.635c1.656-3.387 5.134-5.705 9.18-5.705 2.605 0 4.93.977 6.745 2.56z"
                fill="#EA4335"
              ></path>
              <path
                d="M6.186 12c0 .66.102 1.293.307 1.89L3.05 16.533C2.38 15.17 2 13.63 2 12s.38-3.173 1.05-4.533l3.443 2.635c-.204.595-.307 1.238-.307 1.898z"
                fill="#FBBC05"
              ></path>
              <path
                d="M18.893 19.688c-1.786 1.667-4.168 2.55-6.66 2.55-4.048 0-7.526-2.317-9.18-5.705l3.44-2.635c.79 2.42 3.05 4.152 5.74 4.152 1.32 0 2.474-.308 3.395-.895l3.265 2.533z"
                fill="#34A853"
              ></path>
              <path
                d="M22 12c0 3.34-1.22 5.948-3.107 7.688l-3.265-2.53c1.07-.67 1.814-1.713 2.093-3.063h-5.488V10.14h9.535c.14.603.233 1.255.233 1.86z"
                fill="#4285F4"
              ></path>
            </svg>
            Sign in with Google
          </Clerk.Connection>
          <Clerk.Connection
            name="github"
            className="bg-white bg-opacity-70 rounded-full p-2 text-black w-full flex items-center justify-center gap-2 font-bold mb-4"
          >
            <svg viewBox="0 0 24 24" width={24} height={24}>
              <path
                d="M12 0C5.373 0 0 5.373 0 12c0 5.304 3.438 9.8 8.205 11.387.6.111.82-.261.82-.577v-2.169c-3.338.725-4.038-1.607-4.038-1.607-.546-1.383-1.333-1.754-1.333-1.754-1.089-.743.083-.728.083-.728 1.206.085 1.838 1.237 1.838 1.237 1.07 1.831 2.807 1.301 3.492.995.108-.775.42-1.301.761-1.601-2.665-.303-5.466-1.333-5.466-5.93 0-1.312.469-2.384 1.236-3.22-.124-.303-.536-1.534.117-3.194 0 0 1.007-.322 3.303 1.228.959-.267 1.988-.4 3.008-.404 1.02.004 2.049.137 3.008.404 2.296-1.55 3.303-1.228 3.303-1.228.653 1.66.241 2.891.118 3.194.769.836 1.236 1.908 1.236 3.22 0 4.611-2.805 5.625-5.473 5.918.431.373.815 1.102.815 2.224v3.293c0 .319.218.693.825.577A12.001 12.001 0 0024 12c0-6.627-5.373-12-12-12z"
                fill="#000000"
              />
            </svg>
            Sign up with GitHub
          </Clerk.Connection>
          {/* LOGIN WITH CREDENTIALS */}
          <SignIn.Step name="start">
            <Clerk.Field name="identifier" className="flex flex-col gap-2">
              <Clerk.Input
                placeholder="john@gmail.com"
                className="py-2 px-6 rounded-full text-black w-full placeholder:text-sm"
              />
              <Clerk.FieldError className="text-red-300 text-sm" />
            </Clerk.Field>
            <SignIn.Action
              submit
              className="mt-2 text-sm underline w-full text-center text-iconBlue"
            >
              Continue
            </SignIn.Action>
          </SignIn.Step>
          <SignIn.Step name="verifications">
            <SignIn.Strategy name="password">
              <Clerk.Field name="password" className="flex flex-col gap-2">
                <Clerk.Input
                  placeholder="password"
                  type="password"
                  className="py-2 px-6 rounded-full text-black w-full placeholder:text-sm"
                />
                <Clerk.FieldError className="text-red-300 text-sm" />
              </Clerk.Field>
              <div className="flex flex-col gap-2">
                <SignIn.Action
                  submit
                  className="mt-2 text-sm underline w-full text-center text-iconBlue"
                >
                  Continue
                </SignIn.Action>
                <SignIn.Action
                  navigate="forgot-password"
                  className="mt-2 text-sm underline w-full text-center "
                >
                  Forgot Password?
                </SignIn.Action>
              </div>
            </SignIn.Strategy>
            <SignIn.Strategy name="reset_password_email_code">
              <p className="text-sm mb-2">
                We sent a code to <SignIn.SafeIdentifier />.
              </p>

              <Clerk.Field name="code" className="flex flex-col gap-2">
                <Clerk.Input
                  className="py-2 px-6 rounded-full text-black w-full placeholder:text-sm"
                  placeholder="Verification Code"
                />
                <Clerk.FieldError className="text-red-300 text-sm" />
              </Clerk.Field>

              <SignIn.Action
                submit
                className="mt-2 text-sm underline w-full text-center text-iconBlue"
              >
                Continue
              </SignIn.Action>
            </SignIn.Strategy>
          </SignIn.Step>
          <SignIn.Step
            name="forgot-password"
            className="flex justify-between w-full text-sm"
          >
            <SignIn.SupportedStrategy name="reset_password_email_code">
              <span className="underline text-iconBlue">Reset password</span>
            </SignIn.SupportedStrategy>

            <SignIn.Action navigate="previous" className="underline">
              Go back
            </SignIn.Action>
          </SignIn.Step>
          <SignIn.Step name="reset-password">
            <h1 className="text-xl font-bold mb-4">Reset your password</h1>

            <Clerk.Field name="password">
              <Clerk.Label>New password</Clerk.Label>
              <Clerk.Input type="password" className="py-2 px-6 rounded-full text-black w-full placeholder:text-sm" />
              <Clerk.FieldError className="text-red-300 text-sm" />
            </Clerk.Field>

            <Clerk.Field name="confirmPassword">
              <Clerk.Label>Confirm password</Clerk.Label>
              <Clerk.Input type="password" className="py-2 px-6 rounded-full text-black w-full placeholder:text-sm" />
              <Clerk.FieldError className="text-red-300 text-sm" />
            </Clerk.Field>

            <SignIn.Action
              submit
              className="mt-4 bg-iconBlue text-white rounded-full py-2 px-6 w-full text-center font-bold"
            >
              Reset password
            </SignIn.Action>
          </SignIn.Step>
          {/* OR SIGN UP */}
          <div className="w-full flex items-center gap-4 mt-6">
            <div className="h-px bg-borderGray flex-grow"></div>
            <span className="text-textGrayLight">or</span>
            <div className="h-px bg-borderGray flex-grow"></div>
          </div>
          <Link
            href="/sign-up"
            className="bg-iconBlue rounded-full p-2 text-white font-bold w-full text-center mt-4"
          >
            Create Account
          </Link>
        </SignIn.Root>
      </div>
    </div>
  );
};

export default SignInPage;