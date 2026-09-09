import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { NoAccessPage } from "./no-access-page";
import { useAuthStore, PLATFORM_ADMIN_ROLE } from "../store";
import type { AuthUser } from "@/lib/api/types";

function user(roles: string[]): AuthUser {
  return { id: 1, name: "Dana", email: "dana@gasa.test", roles, merchant: null };
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/no-access"]}>
        <Routes>
          <Route path="/no-access" element={<NoAccessPage />} />
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/app" element={<div>Operator console</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("NoAccessPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ status: "guest", token: null, user: null, sessionNotice: null });
  });

  it("explains the account lacks platform access, and offers sign out", () => {
    useAuthStore.setState({ status: "authed", token: "tok", user: user(["support"]) });

    renderPage();

    expect(screen.getByText("Access restricted")).toBeInTheDocument();
    expect(screen.getByText(/doesn't carry\s+platform administrator access/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });

  // Self-guards, so the page can't be linked into by someone who doesn't
  // belong on it — mirroring how the guard sends non-admins here.
  it("redirects a guest to /login", () => {
    renderPage();

    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("Access restricted")).not.toBeInTheDocument();
  });

  it("redirects an actual platform admin back to /app", () => {
    useAuthStore.setState({
      status: "authed",
      token: "tok",
      user: user([PLATFORM_ADMIN_ROLE]),
    });

    renderPage();

    expect(screen.getByText("Operator console")).toBeInTheDocument();
    expect(screen.queryByText("Access restricted")).not.toBeInTheDocument();
  });
});
