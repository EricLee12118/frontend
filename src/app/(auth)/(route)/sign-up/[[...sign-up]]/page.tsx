"use client";

import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import Link from "next/link";

const SignUpPage = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-cover bg-center">
      <div className="w-full max-w-lg flex flex-col gap-4 p-8 backdrop-blur-lg bg-white/30 rounded-lg shadow-lg">
        <SignUp.Root>          
          <SignUp.Step name="start" className="flex flex-col gap-4">
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
              Sign up with Google
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
            <div className="flex flex-col gap-4">
              <p className="text-white font-semibold">Sign up with Credentials</p>
              <Clerk.Field name="username" className="flex flex-col gap-2">
                <Clerk.Input
                  className="py-2 px-6 rounded-full text-black w-full placeholder:text-sm"
                  placeholder="Username"
                />
                <Clerk.FieldError className="text-red-300 text-sm" />
              </Clerk.Field>
              <Clerk.Field name="emailAddress" className="flex flex-col gap-2">
                <Clerk.Input
                  className="py-2 px-6 rounded-full text-black w-full placeholder:text-sm"
                  placeholder="E-mail"
                />
                <Clerk.FieldError className="text-red-300 text-sm" />
              </Clerk.Field>
              <Clerk.Field name="password" className="flex flex-col gap-2">
                <Clerk.Input
                  type="password"
                  className="py-2 px-6 rounded-full text-black w-full placeholder:text-sm"
                  placeholder="Password"
                />
                <Clerk.FieldError className="text-red-300 text-sm" />
              </Clerk.Field>
              <SignUp.Captcha />
              <SignUp.Action
                submit
                className="bg-iconBlue rounded-full p-2 text-white font-bold w-full text-center"
              >
                Sign up
              </SignUp.Action>
            </div>
          </SignUp.Step>

          <SignUp.Step name="continue" className="flex flex-col gap-4">
            <Clerk.Field name="username">
              <Clerk.Input
                placeholder="username"
                className="py-2 px-6 rounded-full text-black w-full placeholder:text-sm"
              />
              <Clerk.FieldError className="text-red-300 text-sm" />
            </Clerk.Field>

            <SignUp.Action
              submit
              className="w-full text-center text-iconBlue underline"
            >
              Continue
            </SignUp.Action>
          </SignUp.Step>

          <SignUp.Step name="verifications">
            <SignUp.Strategy name="email_code">
              <h1 className="text-sm mb-2 text-white">Check your e-mail</h1>
              <Clerk.Field name="code" className="flex flex-col gap-4">
                <Clerk.Input
                  placeholder="Verification code"
                  className="py-2 px-6 rounded-full text-black w-full placeholder:text-sm"
                />
                <Clerk.FieldError className="text-red-300 text-sm" />
              </Clerk.Field>
              <SignUp.Action
                submit
                className="mt-2 underline text-iconBlue text-sm"
              >
                Verify
              </SignUp.Action>
            </SignUp.Strategy>
          </SignUp.Step>
          
          {/* OR SIGN IN */}
          <div className="w-full flex items-center gap-4 mt-6">
            <div className="h-px bg-borderGray flex-grow"></div>
            <span className="text-textGrayLight">or</span>
            <div className="h-px bg-borderGray flex-grow"></div>
          </div>
          <Link
            href="/sign-in"
            className="bg-iconBlue rounded-full p-2 text-white font-bold w-full text-center mt-4"
          >
            Already have an account?
          </Link>
        </SignUp.Root>
      </div>
    </div>
  );
};

export default SignUpPage;