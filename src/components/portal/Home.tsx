"use client";

import { useState } from "react";
import styles from "./Home.module.css";

export default function Home() {
  const [selectedRole, setSelectedRole] = useState<"vendor" | "customer" | null>(null);
  const [mode, setMode] = useState<"register" | "login" | null>(null);
  const [loading, setLoading] = useState(false);

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "login" && selectedRole) {
      // ✅ login ke liye json body (username + password)
      const form = new FormData(e.currentTarget);
      const payload = {
        username: form.get("username"),
        password: form.get("password"),
      };

      const res = await fetch(`/api/${selectedRole}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      alert(result.message);

      if (res.ok) {
        if (selectedRole === "vendor") {
          window.location.href = "/vendor/dashboard";
        } else {
          window.location.href = "/customer/dashboard";
        }
      }
    } else {
      // ✅ register ke liye file upload rahega
      const formData = new FormData(e.currentTarget);
      const res = await fetch(`/api/${selectedRole}/register`, {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      alert(result.message);
    }

    setLoading(false);
    setMode(null);
    setSelectedRole(null);
  };

  return (
    <div className={styles.container}>
      {loading && <div className={styles.loader}>Loading...</div>}

      <div className={styles.card}>
        {!selectedRole ? (
          <>
            <h1 className={styles.title}>🚛 Apexcel Portal</h1>
            <button className={styles.btn} onClick={() => setSelectedRole("vendor")}>
              Vendor
            </button>
            <button className={styles.btn} onClick={() => setSelectedRole("customer")}>
              Customer
            </button>
          </>
        ) : !mode ? (
          <>
            <h2 className={styles.title}>{capitalize(selectedRole)} Panel</h2>
            <button className={styles.btn} onClick={() => setMode("register")}>
              Register
            </button>
            <button className={styles.btn} onClick={() => setMode("login")}>
              Login
            </button>
            <button className={styles.back} onClick={() => setSelectedRole(null)}>
              ⬅ Back
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 className={styles.title}>
              {capitalize(selectedRole)} {capitalize(mode)}
            </h2>

            {mode === "register" && (
              <>
                {/* common fields */}
                <input
                  name="username"
                  placeholder="Username"
                  className={styles.input}
                  required
                />
                <input
                  name={selectedRole === "vendor" ? "vendorName" : "customerName"}
                  placeholder="Full Name"
                  className={styles.input}
                  required
                />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className={styles.input}
                  required
                />
                <input
                  name="phone"
                  placeholder="Phone Number"
                  className={styles.input}
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className={styles.input}
                  required
                />
                <input name="address" placeholder="Address" className={styles.input} />
                <input name="city" placeholder="City" className={styles.input} />
                <input name="state" placeholder="State" className={styles.input} />
                <input name="pinCode" placeholder="PIN Code" className={styles.input} />

                {/* vendor extra fields */}
                {selectedRole === "vendor" && (
                  <>
                    <select name="vendorType" className={styles.input}>
                      <option value="">Select Vendor Type</option>
                      <option value="transporter">Transporter</option>
                      <option value="driver">Driver</option>
                      <option value="contractor">Contractor</option>
                      <option value="supplier">Supplier</option>
                    </select>
                    <input name="companyName" placeholder="Company Name" className={styles.input} />
                    <input name="accountType" placeholder="Account Type" className={styles.input} />
                    <input name="bankAccountNo" placeholder="Bank Account Number" className={styles.input} />
                    <input name="bankName" placeholder="Bank Name" className={styles.input} />
                    <input name="ifsc" placeholder="IFSC Code" className={styles.input} />
                    <input name="accountHolder" placeholder="Account Holder Name" className={styles.input} />
                    <input name="upi" placeholder="UPI ID" className={styles.input} />
                    <input name="paymentTerms" placeholder="Payment Terms" className={styles.input} />
                    <input name="gstNumber" placeholder="GST Number" className={styles.input} />
                    <input type="file" name="gstImage" accept="image/*,.svg" className={styles.input} />
                    <input type="file" name="aadharCard" accept="image/*,.svg" className={styles.input} />
                    <input name="panNumber" placeholder="PAN Number (Vendor Code)" className={styles.input} />
                    <input type="file" name="panImage" accept="image/*,.svg" className={styles.input} />
                    <input type="file" name="cancelCheque" accept="image/*,.svg" className={styles.input} />
                    <textarea name="message" placeholder="Message" className={styles.input}></textarea>
                  </>
                )}

                {/* customer extra fields */}
                {selectedRole === "customer" && (
                  <>
                    <select name="freightTerms" className={styles.input}>
                      <option value="">Select Freight Terms</option>
                      <option value="Paid">Paid</option>
                      <option value="To Pay">To Pay</option>
                      <option value="TBB">TBB</option>
                      <option value="Transporter">Transporter</option>
                    </select>
                    <select name="customerType" className={styles.input}>
                      <option value="">Select Customer Type</option>
                      <option value="Individual">Individual</option>
                      <option value="Govt">Govt</option>
                      <option value="Company">Company</option>
                    </select>
                    <input name="companyName" placeholder="Company Name" className={styles.input} />
                    <input name="accountType" placeholder="Account Type" className={styles.input} />
                    <input name="bankAccountNo" placeholder="Bank Account Number" className={styles.input} />
                    <input name="bankName" placeholder="Bank Name" className={styles.input} />
                    <input name="ifsc" placeholder="IFSC Code" className={styles.input} />
                    <input name="accountHolder" placeholder="Account Holder Name" className={styles.input} />
                    <input name="upi" placeholder="UPI ID" className={styles.input} />
                    <input name="gstNumber" placeholder="GST Number" className={styles.input} />
                    <input type="file" name="gstImage" accept="image/*,.svg" className={styles.input} />
                    <input type="file" name="aadharCard" accept="image/*,.svg" className={styles.input} />
                    <input name="panNumber" placeholder="PAN Number" className={styles.input} />
                    <input type="file" name="panImage" accept="image/*,.svg" className={styles.input} />
                    <input type="file" name="cancelCheque" accept="image/*,.svg" className={styles.input} />
                    <input name="paymentTerms" placeholder="Payment Terms" className={styles.input} />
                    <textarea name="message" placeholder="Message" className={styles.input}></textarea>
                  </>
                )}
              </>
            )}

            {mode === "login" && (
              <>
                <input
                  name="username"
                  placeholder="Username"
                  className={styles.input}
                  required
                />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className={styles.input}
                  required
                />
              </>
            )}

            <button type="submit" className={styles.btn}>Submit</button>
            <button type="button" className={styles.back} onClick={() => setMode(null)}>
              ⬅ Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}