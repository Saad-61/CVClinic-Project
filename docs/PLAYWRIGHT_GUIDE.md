# Playwright End-to-End Testing Guide

Welcome to the Playwright learning guide! This document is designed to help you understand what Playwright is, why it is a modern industry standard for E2E (End-to-End) testing, and how to write tests for **CVClinic**.

---

## 🚀 1. What is Playwright?

**Playwright** is a modern, fast, and reliable framework for Web Testing and Automation developed by Microsoft. It allows you to test web applications across **Chromium** (Chrome, Edge), **Firefox**, and **WebKit** (Safari) with a single unified API.

### Key Features that make Playwright superior:

1. **Auto-Waiting**: Playwright automatically waits for elements to be actionable (visible, enabled, stable, attached) before performing actions like `click()` or `fill()`. No more arbitrary `sleep(3000)` or flaky timeout workarounds.
2. **Isolated Browser Contexts**: Instead of launching a brand new browser instance for every single test (which is slow), Playwright uses **Browser Contexts**. They act like incognito tabs, providing complete isolation (cookies, local storage, cache) in a fraction of a millisecond.
3. **Powerful Tooling**:
   * **Codegen (Code Generator)**: Record your actions in the browser and automatically generate test scripts.
   * **UI Mode**: Run tests interactively with a visual timeline, step-by-step DOM inspection, and watch mode.
   * **Trace Viewer**: Capture screenshot history, console logs, network requests, and execution times for post-mortem debugging.
4. **API Testing Integration**: Send HTTP requests directly from your test files to mock or seed data in the backend.

---

## 🛠️ 2. Setting Up Playwright in Node.js (React Frontend)

Since the CVClinic frontend uses Vite + React + TypeScript, installing Playwright directly in the `frontend/` directory is the most common approach for E2E testing.

### Step 1: Install Playwright
Open a terminal in the `frontend` folder and run the official initializer:

```bash
cd frontend
npm init playwright@latest
```

During the prompt, select the following options:
* **Where to put your end-to-end tests?** `tests`
* **Add a GitHub Actions workflow?** `y` (adds `.github/workflows/playwright.yml`)
* **Install Playwright browsers?** `y` (downloads Chromium, Firefox, WebKit binaries)

### Step 2: Understand the Generated Structure
* **`playwright.config.ts`**: Configuration file where you specify test directories, base URLs, retry behaviors, browser projects, and dev server configurations.
* **`tests/`**: The folder containing your test spec files (e.g. `example.spec.ts`).
* **`tests-examples/`**: A folder containing demo tests for a web app (you can delete this once you're comfortable).

---

## ✍️ 3. Writing Your First Test for CVClinic

Let's look at how we can write a test for the CVClinic landing page. We want to verify that the page loads, shows the hero headline, and lets the user toggle between **Best Matches** and **Match a Job** analysis modes.

Here is a sample test. Create a file called `frontend/tests/cvclinic.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

// Group tests together
test.describe('CVClinic Landing Page', () => {

  // Before each test, navigate to the local dev server
  test.beforeEach(async ({ page }) => {
    // Vite runs on http://localhost:5173 by default
    await page.goto('http://localhost:5173');
  });

  test('should display the main hero title', async ({ page }) => {
    // 1. Locate the hero headline (BlurText creates spans or nested structures)
    const heroTitle = page.locator('h1');
    
    // 2. Assert that the hero title is visible and contains expected text
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText('Your CV,');
    await expect(heroTitle).toContainText('finally matched');
  });

  test('should allow toggling between analysis modes', async ({ page }) => {
    // Locate the tabs trigger buttons
    const bestMatchesTab = page.getByRole('tab', { name: 'Best Matches' });
    const matchAJobTab = page.getByRole('tab', { name: 'Match a Job' });

    // Assert "Best Matches" is selected by default (aria-selected attribute)
    await expect(bestMatchesTab).toHaveAttribute('aria-selected', 'true');
    await expect(matchAJobTab).toHaveAttribute('aria-selected', 'false');

    // Click "Match a Job" and assert the selection shifts
    await matchAJobTab.click();
    await expect(bestMatchesTab).toHaveAttribute('aria-selected', 'false');
    await expect(matchAJobTab).toHaveAttribute('aria-selected', 'true');

    // Verify that the Job Description input textarea appears
    const jdLabel = page.getByText(/Found a role on LinkedIn/i);
    await expect(jdLabel).toBeVisible();
  });

  test('should fail gracefully or alert when submitting without a file', async ({ page }) => {
    // Locate the Analyze My CV button (in mobile layout or desktop)
    const analyzeButton = page.getByRole('button', { name: /Analyze My CV/i });
    
    // Check if the button is visible or click it if present
    if (await analyzeButton.isVisible()) {
      await analyzeButton.click();
      
      // Verify that the page scrolled to the upload section
      const uploadHeading = page.getByRole('heading', { name: 'Analyze your CV' });
      await expect(uploadHeading).toBeInViewport();
    }
  });
});
```

---

## 🏃‍♂️ 4. Running & Debugging Your Tests

Use the following commands inside `frontend/` to run your tests:

### 1. Run all tests (Headless - background)
```bash
npx playwright test
```

### 2. Run tests in UI Mode (Recommended for learning!)
This opens a full-featured electron app. You can click on tests, watch them execute step-by-step, inspect the DOM at each moment in time, and see console logs.
```bash
npx playwright test --ui
```

### 3. Debugging with Codegen (Write tests by clicking)
Playwright can watch you click around a website and generate the test code automatically:
```bash
npx playwright codegen http://localhost:5173
```
This opens two windows: a browser window and a code recorder window. As you click on tabs, type, or interact, it writes the locator code in real-time!

### 4. View Test Reports
If a test fails, Playwright creates an interactive HTML report showing the step where it failed, the screenshot, and console logs.
```bash
npx playwright show-report
```

---

## 🐍 5. Alternative: Playwright in Python (Backend / Data Science)

Since CVClinic has a robust Python backend (`backend/`), you can also run Playwright tests in Python! This is ideal if you want to write end-to-end integration tests using `pytest`.

### Step 1: Install Python packages
Activate your virtual environment and install the pytest-playwright plugin:

```bash
cd backend
.venv\Scripts\activate
pip install pytest-playwright
playwright install
```

### Step 2: Write a Python test
Create a file `backend/tests/test_e2e.py`:

```python
import pytest
from playwright.sync_api import Page, expect

def test_landing_page_title(page: Page):
    # Navigate to the frontend
    page.goto("http://localhost:5173")
    
    # Assert hero is present
    hero = page.locator("h1")
    expect(hero).to_be_visible()
    assert "Your CV" in hero.inner_text()

def test_landing_page_tabs(page: Page):
    page.goto("http://localhost:5173")
    
    # Locate buttons using role selectors
    best_matches_tab = page.get_by_role("tab", name="Best Matches")
    match_job_tab = page.get_by_role("tab", name="Match a Job")
    
    # Assert defaults
    expect(best_matches_tab).to_have_attribute("aria-selected", "true")
    expect(match_job_tab).to_have_attribute("aria-selected", "false")
    
    # Click and verify state change
    match_job_tab.click()
    expect(best_matches_tab).to_have_attribute("aria-selected", "false")
    expect(match_job_tab).to_have_attribute("aria-selected", "true")
```

### Step 3: Run Python tests
```bash
pytest --playwright  # Runs tests in headless mode
pytest --playwright --headed  # Runs tests in a visible browser
```

---

## 💡 Best Practices for Writing E2E Tests

1. **Use Locators, not Selectors**: Instead of target-specific CSS selectors like `page.locator('.btn-primary')` or `page.locator('div > ul > li')`, use user-facing locators like `page.getByRole()`, `page.getByLabel()`, or `page.getByText()`. This makes your tests resilient to layout or style refactorings.
2. **Avoid `page.waitForTimeout(ms)`**: Using fixed sleep values makes tests slow and flaky. Instead, assert conditions (e.g. `await expect(locator).toBeVisible()`) or use state wait actions like `await page.waitForResponse(url)`.
3. **Configure the Dev Server**: You can tell Playwright to automatically start your Vite dev server before running tests and shut it down afterwards by configuring `webServer` in `playwright.config.ts`:
   ```typescript
   webServer: {
     command: 'npm run dev',
     url: 'http://localhost:5173',
     reuseExistingServer: !process.env.CI,
   }
   ```
