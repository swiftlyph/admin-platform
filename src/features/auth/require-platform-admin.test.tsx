import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { RequirePlatformAdmin } from "./require-platform-admin";
import { useAuthStore, PLATFORM_ADMIN_ROLE } from "./store";
import type { AuthUser } from "@/lib/api/types";

function user(roles: string[]): AuthUser {
  return { id: 1, name: "A", email: "a@gasa.test", roles, merchant: null };
}

function renderGuardedApp() {
  return render(
    <MemoryRouter initialEntries={["/app"]}>
      <Routes>
        <Route path="/login" element={<div>Login page</div>} />
        <Route path="/no-access" element={<div>No access page</div>} />
        <Route
          path="/app"
          element={
            <RequirePlatformAdmin>
              <div>Operator console</div>
            </RequirePlatformAdmin>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RequirePlatformAdmin", () => {
  beforeEach(() => {
    useAuthStore.setState({ status: "guest", token: null, user: null, sessionNotice: null });
  });

  it("redirects guests to /login, not /no-access", () => {
    renderGuardedApp();

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Operator console")).not.toBeInTheDocument();
  });

  it("sends an authed non-admin to /no-access", () => {
    useAuthStore.setState({ status: "authed", token: "tok", user: user(["support"]) });

    renderGuardedApp();

    expect(screen.getByText("No access page")).toBeInTheDocument();
    expect(screen.queryByText("Operator console")).not.toBeInTheDocument();
  });

  it("renders the protected content for a platform admin", () => {
    useAuthStore.setState({
      status: "authed",
      token: "tok",
      user: user([PLATFORM_ADMIN_ROLE]),
    });

    renderGuardedApp();

    expect(screen.getByText("Operator console")).toBeInTheDocument();
  });

  // A merchant-shaped account should never reach the operator console just
  // because it happens to hold other roles alongside a tenant one.
  it("admits a user holding the admin role among several", () => {
    useAuthStore.setState({
      status: "authed",
      token: "tok",
      user: user(["support", PLATFORM_ADMIN_ROLE]),
    });

    renderGuardedApp();

    expect(screen.getByText("Operator console")).toBeInTheDocument();
  });

  it("rejects an authed user with no roles at all", () => {
    useAuthStore.setState({ status: "authed", token: "tok", user: user([]) });

    renderGuardedApp();

    expect(screen.getByText("No access page")).toBeInTheDocument();
  });
});
