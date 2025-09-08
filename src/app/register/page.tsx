"use client";

import React, { useState } from "react";
import Link from "next/link";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import FileInput from "@/components/form/input/FileInput";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";

type Role = "vendor" | "customer";

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("vendor");
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg("");
    if (!agree) return setMsg("Please accept Terms & Privacy.");

    setLoading(true);
    try {
      const form = new FormData(e.currentTarget);
      form.set("role", role);
      const res = await fetch("/api/auth/register", { method: "POST", body: form });
      const data = await res.json();
      setMsg(res.ok ? `${data.message}. You can sign in now.` : (data?.message || "Registration failed"));
    } catch (err: any) {
      setMsg(err?.message || "Server error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* top bar (back link) */}
      <div className="w-full max-w-2xl mx-auto sm:pt-10 px-4 sm:px-6 mb-5">
        <Link
          href="/"
          className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
        >
          <ChevronLeftIcon />
          Back to dashboard
        </Link>
      </div>

      {/* main content */}
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pb-12">
        <div className="mb-5 sm:mb-8">
          <div className="flex items-center gap-2 mb-3">
            <button
              type="button"
              onClick={() => setRole("vendor")}
              className={`px-3 py-1.5 rounded-md text-sm ${
                role === "vendor"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white/80"
              }`}
            >
              Vendor
            </button>
            <button
              type="button"
              onClick={() => setRole("customer")}
              className={`px-3 py-1.5 rounded-md text-sm ${
                role === "customer"
                  ? "bg-brand-500 text-white"
                  : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white/80"
              }`}
            >
              Customer
            </button>
          </div>

          <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
            Sign Up
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enter your details to create an account!
          </p>
        </div>

        <form onSubmit={onSubmit}>
          <div className="space-y-5">
            {/* common fields */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <Label>First Name<span className="text-error-500">*</span></Label>
                <Input name="firstName" placeholder="Enter your first name" />
              </div>
              <div>
                <Label>Last Name<span className="text-error-500">*</span></Label>
                <Input name="lastName" placeholder="Enter your last name" />
              </div>
            </div>

            <div>
              <Label>Username<span className="text-error-500">*</span></Label>
              <Input name="username" placeholder="your.username" />
            </div>

            <div>
              <Label>Email<span className="text-error-500">*</span></Label>
              <Input type="email" name="email" placeholder="Enter your email" />
            </div>

            <div>
              <Label>Phone<span className="text-error-500">*</span></Label>
              <Input name="phone" placeholder="Phone number" />
            </div>

            <div>
              <Label>Password<span className="text-error-500">*</span></Label>
              <div className="relative">
                <Input
                  name="password"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
                />
                <span
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                  )}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div><Label>Address</Label><Input name="address" placeholder="Address" /></div>
              <div><Label>City</Label><Input name="city" placeholder="City" /></div>
              <div><Label>State</Label><Input name="state" placeholder="State" /></div>
              <div><Label>PIN Code</Label><Input name="pinCode" placeholder="PIN Code" /></div>
            </div>

            {/* role-specific */}
            {role === "vendor" ? (
              <>
                <div>
                  <Label>Vendor Name<span className="text-error-500">*</span></Label>
                  <Input name="vendorName" placeholder="Vendor full name" />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <Label>Vendor Type</Label>
                    <select
                      name="vendorType"
                      className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    >
                      <option value="">Select Vendor Type</option>
                      <option value="transporter">Transporter</option>
                      <option value="driver">Driver</option>
                      <option value="contractor">Contractor</option>
                      <option value="supplier">Supplier</option>
                    </select>
                  </div>
                  <div><Label>Company Name</Label><Input name="companyName" placeholder="Company Name" /></div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div><Label>Account Type</Label><Input name="accountType" placeholder="Savings/Current" /></div>
                  <div><Label>Bank Account No</Label><Input name="bankAccountNo" placeholder="Account Number" /></div>
                  <div><Label>Bank Name</Label><Input name="bankName" placeholder="Bank Name" /></div>
                  <div><Label>IFSC</Label><Input name="ifsc" placeholder="IFSC Code" /></div>
                  <div><Label>Account Holder</Label><Input name="accountHolder" placeholder="Account Holder Name" /></div>
                  <div><Label>UPI</Label><Input name="upi" placeholder="UPI ID" /></div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div><Label>Payment Terms</Label><Input name="paymentTerms" placeholder="e.g. 7 days" /></div>
                  <div><Label>GST Number</Label><Input name="gstNumber" placeholder="GST Number" /></div>
                  <div><Label>PAN Number<span className="text-error-500">*</span></Label><Input name="panNumber" placeholder="PAN (Vendor Code)" /></div>
                </div>

                {/* pretty file inputs */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div><Label>GST Image</Label><FileInput name="gstImage" accept="image/*,.svg" /></div>
                  <div><Label>Aadhar Card</Label><FileInput name="aadharCard" accept="image/*,.svg" /></div>
                  <div><Label>PAN Image</Label><FileInput name="panImage" accept="image/*,.svg" /></div>
                  <div><Label>Cancel Cheque</Label><FileInput name="cancelCheque" accept="image/*,.svg" /></div>
                </div>

                <div>
                  <Label>Message</Label>
                  <textarea
                    name="message"
                    className="h-28 w-full rounded-lg border px-4 py-3 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Customer Name<span className="text-error-500">*</span></Label>
                  <Input name="customerName" placeholder="Customer full name" />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <Label>Freight Terms</Label>
                    <select
                      name="freightTerms"
                      className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    >
                      <option value="">Select Freight Terms</option>
                      <option value="Paid">Paid</option>
                      <option value="To Pay">To Pay</option>
                      <option value="TBB">TBB</option>
                      <option value="Transporter">Transporter</option>
                    </select>
                  </div>
                  <div>
                    <Label>Customer Type</Label>
                    <select
                      name="customerType"
                      className="h-11 w-full rounded-lg border px-4 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                    >
                      <option value="">Select Customer Type</option>
                      <option value="Individual">Individual</option>
                      <option value="Govt">Govt</option>
                      <option value="Company">Company</option>
                    </select>
                  </div>
                  <div><Label>Company Name</Label><Input name="companyName" placeholder="Company Name" /></div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div><Label>Account Type</Label><Input name="accountType" placeholder="Savings/Current" /></div>
                  <div><Label>Bank Account No</Label><Input name="bankAccountNo" placeholder="Account Number" /></div>
                  <div><Label>Bank Name</Label><Input name="bankName" placeholder="Bank Name" /></div>
                  <div><Label>IFSC</Label><Input name="ifsc" placeholder="IFSC Code" /></div>
                  <div><Label>Account Holder</Label><Input name="accountHolder" placeholder="Account Holder Name" /></div>
                  <div><Label>UPI</Label><Input name="upi" placeholder="UPI ID" /></div>
                  <div><Label>Payment Terms</Label><Input name="paymentTerms" placeholder="e.g. 7 days" /></div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div><Label>GST Number</Label><Input name="gstNumber" placeholder="GST Number" /></div>
                  <div><Label>PAN Number</Label><Input name="panNumber" placeholder="PAN Number" /></div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div><Label>GST Image</Label><FileInput name="gstImage" accept="image/*,.svg" /></div>
                  <div><Label>Aadhar Card</Label><FileInput name="aadharCard" accept="image/*,.svg" /></div>
                  <div><Label>PAN Image</Label><FileInput name="panImage" accept="image/*,.svg" /></div>
                  <div><Label>Cancel Cheque</Label><FileInput name="cancelCheque" accept="image/*,.svg" /></div>
                </div>

                <div>
                  <Label>Message</Label>
                  <textarea
                    name="message"
                    className="h-28 w-full rounded-lg border px-4 py-3 text-sm dark:bg-gray-900 dark:text-white/90 dark:border-gray-700"
                  />
                </div>
              </>
            )}

            {/* terms */}
            <div className="flex items-center gap-3">
              <Checkbox checked={agree} onChange={setAgree} />
              <p className="inline-block font-normal text-gray-500 dark:text-gray-400">
                By creating an account you agree to the{" "}
                <span className="text-gray-800 dark:text-white/90">Terms &amp; Conditions</span>{" "}
                and{" "}
                <span className="text-gray-800 dark:text-white">Privacy Policy</span>
              </p>
            </div>

            {/* submit */}
            <div>
              <button
                disabled={loading}
                className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600 disabled:opacity-50"
              >
                {loading ? "Please wait..." : "Sign Up"}
              </button>
            </div>

            {msg ? (
              <div className="text-sm font-medium mt-1.5 text-center text-gray-700 dark:text-gray-300">
                {msg}
              </div>
            ) : null}
          </div>
        </form>

        <div className="mt-5">
          <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-500 hover:text-brand-600 dark:text-brand-400">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}