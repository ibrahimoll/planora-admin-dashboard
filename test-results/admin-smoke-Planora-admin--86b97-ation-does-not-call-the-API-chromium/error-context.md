# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-smoke.spec.ts >> Planora admin smoke >> login page loads and empty validation does not call the API
- Location: tests\e2e\admin-smoke.spec.ts:13:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: getByRole('alert')
Expected substring: "Enter your email/username and password."
Error: strict mode violation: getByRole('alert') resolved to 2 elements:
    1) <p role="alert" id="admin-login-error" class="flex items-start gap-3 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-100">…</p> aka locator('#admin-login-error')
    2) <div role="alert" aria-live="assertive" id="__next-route-announcer__"></div> aka locator('[id="__next-route-announcer__"]')

Call log:
  - Expect "toContainText" with timeout 10000ms
  - waiting for getByRole('alert')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e4]:
      - link "Planora Admin dashboard" [ref=e6] [cursor=pointer]:
        - /url: /login
        - img [ref=e11]
        - generic [ref=e17]:
          - generic [ref=e18]: Planora
          - generic [ref=e19]: Admin dashboard
      - generic [ref=e20]:
        - generic [ref=e21]:
          - paragraph [ref=e22]: Admin access
          - heading "Welcome back" [level=1] [ref=e23]
          - paragraph [ref=e24]: Sign in with your Planora admin account to manage the dashboard.
        - generic [ref=e25]:
          - generic [ref=e26]:
            - text: Email or username
            - generic [ref=e27]:
              - img
              - textbox "Email or username" [ref=e28]:
                - /placeholder: admin@planora.ai
          - generic [ref=e29]:
            - generic [ref=e30]:
              - generic [ref=e31]: Password
              - link "Forgot password?" [ref=e32] [cursor=pointer]:
                - /url: /forgot-password
            - generic [ref=e33]:
              - img
              - textbox "Password" [ref=e34]:
                - /placeholder: Enter your password
              - button "Show password" [ref=e35]:
                - img [ref=e36]
          - alert [ref=e39]:
            - img [ref=e40]
            - generic [ref=e42]: Enter your email/username and password.
          - button "Login to dashboard" [active] [ref=e43]:
            - text: Login to dashboard
            - img [ref=e44]
        - generic [ref=e48]: Protected admin access
      - paragraph [ref=e52]: Planora Admin Dashboard · Secure access only
  - alert [ref=e53]
```

# Test source

```ts
  1   | import { expect, test, type Page } from "@playwright/test";
  2   | 
  3   | const adminUrl = process.env.PLANORA_ADMIN_URL?.replace(/\/+$/, "");
  4   | const adminUsername = process.env.PLANORA_ADMIN_USERNAME;
  5   | const adminPassword = process.env.PLANORA_ADMIN_PASSWORD;
  6   | 
  7   | const hasAdminUrl = Boolean(adminUrl);
  8   | const hasAdminCredentials = Boolean(adminUsername && adminPassword);
  9   | 
  10  | test.describe("Planora admin smoke", () => {
  11  |   test.skip(!hasAdminUrl, "PLANORA_ADMIN_URL is required.");
  12  | 
  13  |   test("login page loads and empty validation does not call the API", async ({
  14  |     page,
  15  |   }) => {
  16  |     let loginApiCalls = 0;
  17  |     page.on("request", (request) => {
  18  |       if (
  19  |         request.method() === "POST" &&
  20  |         request.url().includes("/auth/login")
  21  |       ) {
  22  |         loginApiCalls += 1;
  23  |       }
  24  |     });
  25  | 
  26  |     await page.goto("/login");
  27  | 
  28  |     await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
  29  | 
  30  |     const usernameInput = page.locator("#admin-login-identifier");
  31  |     await expect(usernameInput).toHaveAttribute("name", "username");
  32  |     await expect(usernameInput).toHaveAttribute("autocomplete", "username");
  33  |     await expect(usernameInput).toHaveAttribute("required", "");
  34  | 
  35  |     const passwordInput = page.locator("#admin-login-password");
  36  |     await expect(passwordInput).toHaveAttribute("name", "password");
  37  |     await expect(passwordInput).toHaveAttribute(
  38  |       "autocomplete",
  39  |       "current-password",
  40  |     );
  41  |     await expect(passwordInput).toHaveAttribute("required", "");
  42  | 
  43  |     await page.getByRole("button", { name: /login to dashboard/i }).click();
  44  | 
> 45  |     await expect(page.getByRole("alert")).toContainText(
      |                                           ^ Error: expect(locator).toContainText(expected) failed
  46  |       "Enter your email/username and password.",
  47  |     );
  48  |     expect(loginApiCalls).toBe(0);
  49  |   });
  50  | 
  51  |   test.describe("authenticated flows", () => {
  52  |     test.skip(
  53  |       !hasAdminCredentials,
  54  |       "PLANORA_ADMIN_USERNAME and PLANORA_ADMIN_PASSWORD are required.",
  55  |     );
  56  | 
  57  |     test("admin can log in, refresh, open notifications, log out, and stay protected", async ({
  58  |       page,
  59  |     }) => {
  60  |       await loginAsAdmin(page);
  61  |       await expect(page).toHaveURL(/\/dashboard(?:\/)?(?:[?#].*)?$/);
  62  | 
  63  |       await page.reload();
  64  |       await expect(page).toHaveURL(/\/dashboard(?:\/)?(?:[?#].*)?$/);
  65  |       await expect(
  66  |         page.getByRole("button", { name: "Notifications" }),
  67  |       ).toBeVisible();
  68  | 
  69  |       await openNotificationDropdown(page, { width: 1440, height: 900 });
  70  | 
  71  |       await page.getByRole("button", { name: /^Logout$/ }).last().click();
  72  |       await expect(page).toHaveURL(/\/login(?:[?#].*)?$/);
  73  | 
  74  |       const storageState = await page.evaluate(() => ({
  75  |         token: sessionStorage.getItem("planora_admin_token"),
  76  |         currentAdmin: localStorage.getItem("current_admin"),
  77  |       }));
  78  | 
  79  |       expect(storageState).toEqual({
  80  |         token: null,
  81  |         currentAdmin: null,
  82  |       });
  83  | 
  84  |       await page.goto("/dashboard");
  85  |       await expect(page).toHaveURL(/\/login(?:[?#].*)?$/);
  86  |     });
  87  | 
  88  |     test("mobile notification dropdown stays inside the viewport", async ({
  89  |       page,
  90  |     }) => {
  91  |       await page.setViewportSize({ width: 390, height: 844 });
  92  |       await loginAsAdmin(page);
  93  | 
  94  |       await openNotificationDropdown(page, { width: 390, height: 844 });
  95  |     });
  96  |   });
  97  | });
  98  | 
  99  | async function loginAsAdmin(page: Page) {
  100 |   await page.goto("/login");
  101 |   await page.locator("#admin-login-identifier").fill(adminUsername ?? "");
  102 |   await page.locator("#admin-login-password").fill(adminPassword ?? "");
  103 |   await page.getByRole("button", { name: /login to dashboard/i }).click();
  104 |   await page.waitForURL(/\/dashboard(?:\/)?(?:[?#].*)?$/, { timeout: 60_000 });
  105 | }
  106 | 
  107 | async function openNotificationDropdown(
  108 |   page: Page,
  109 |   viewport: { width: number; height: number },
  110 | ) {
  111 |   await page.setViewportSize(viewport);
  112 | 
  113 |   const button = page.getByRole("button", { name: "Notifications" });
  114 |   await expect(button).toBeVisible();
  115 |   await button.click();
  116 | 
  117 |   await expect
  118 |     .poll(() => getNotificationDropdownBox(page))
  119 |     .not.toBeNull();
  120 | 
  121 |   const box = await getNotificationDropdownBox(page);
  122 |   expect(box).not.toBeNull();
  123 |   expect(box?.left).toBeGreaterThanOrEqual(0);
  124 |   expect(box?.right).toBeLessThanOrEqual(viewport.width);
  125 | 
  126 |   const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  127 |   expect(scrollWidth).toBeLessThanOrEqual(viewport.width);
  128 | 
  129 |   await page.mouse.click(8, 8);
  130 |   await expect(button).toHaveAttribute("aria-expanded", "false");
  131 | 
  132 |   await button.click();
  133 |   await expect
  134 |     .poll(() => getNotificationDropdownBox(page))
  135 |     .not.toBeNull();
  136 | 
  137 |   await page.keyboard.press("Escape");
  138 |   await expect(button).toHaveAttribute("aria-expanded", "false");
  139 | }
  140 | 
  141 | async function getNotificationDropdownBox(page: Page) {
  142 |   return page.evaluate(() => {
  143 |     const title = Array.from(document.querySelectorAll("p")).find(
  144 |       (element) => element.textContent?.trim() === "Notifications",
  145 |     );
```