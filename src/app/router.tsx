import { createBrowserRouter, Navigate } from "react-router-dom";
import { LoginPage } from "@/features/auth/pages/login-page";
import { NoAccessPage } from "@/features/auth/pages/no-access-page";
import { RequirePlatformAdmin } from "@/features/auth/require-platform-admin";
import { DashboardLayout } from "@/app/dashboard-layout";
import { DashboardPage } from "@/features/dashboard/pages/dashboard-page";
import { CompaniesPage } from "@/features/organizations/pages/companies-page";
import { MerchantsPage } from "@/features/organizations/pages/merchants-page";
import { TransactionsPage } from "@/features/transactions/pages/transactions-page";
import { RedemptionsPage } from "@/features/redemptions/pages/redemptions-page";
import { NotFound } from "@/app/not-found";

export const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/login" replace /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/no-access", element: <NoAccessPage /> },
  {
    path: "/app",
    element: (
      <RequirePlatformAdmin>
        <DashboardLayout />
      </RequirePlatformAdmin>
    ),
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage />, handle: { title: "Dashboard" } },
      { path: "companies", element: <CompaniesPage />, handle: { title: "Companies" } },
      { path: "merchants", element: <MerchantsPage />, handle: { title: "Merchants" } },
      {
        path: "transactions",
        element: <TransactionsPage />,
        handle: { title: "Transactions" },
      },
      {
        path: "redemptions",
        element: <RedemptionsPage />,
        handle: { title: "Redemptions" },
      },
    ],
  },
  { path: "*", element: <NotFound /> },
]);
