import { test, expect } from '@playwright/test';

test.describe('CVClinic Landing Page', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the base URL configured in playwright.config.ts (http://localhost:5173)
    await page.goto('/');
  });

  test('should display the main hero title', async ({ page }) => {
    // Locate the h1 element
    const heroTitle = page.locator('h1');
    
    // 2. Assert that the hero title is visible and contains expected text
    // Note: Space characters are rendered via CSS margins in the <BlurText /> component,
    // so raw text content is concatenated without spaces in the DOM.
    await expect(heroTitle).toBeVisible();
    await expect(heroTitle).toContainText('YourCV,');
    await expect(heroTitle).toContainText('finallymatched');
  });

  test('should allow toggling between analysis modes', async ({ page }) => {
    // Locate the tab buttons
    const bestMatchesTab = page.getByRole('tab', { name: 'Best Matches' });
    const matchAJobTab = page.getByRole('tab', { name: 'Match a Job' });

    // Assert "Best Matches" tab is selected by default
    await expect(bestMatchesTab).toHaveAttribute('aria-selected', 'true');
    await expect(matchAJobTab).toHaveAttribute('aria-selected', 'false');

    // Click "Match a Job"
    await matchAJobTab.click();

    // Assert "Match a Job" tab is now selected
    await expect(bestMatchesTab).toHaveAttribute('aria-selected', 'false');
    await expect(matchAJobTab).toHaveAttribute('aria-selected', 'true');

    // Verify the Job Description textarea label or helper text becomes visible
    const jdHelperText = page.getByText(/Found a role on LinkedIn/i);
    await expect(jdHelperText).toBeVisible();
  });
});

test('recorded codegen test', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('img', { name: 'CVClinic Logo' }).click();
  await page.getByRole('tab', { name: 'Match a Job' }).click();
  await page.getByRole('tab', { name: 'Best Matches' }).click();
  await page.getByRole('combobox').click();
  await page.getByRole('option', { name: 'Software Engineer' }).click();
  await page.getByRole('button', { name: 'How does the matching logic' }).click();
  await page.getByRole('button', { name: 'How does the matching logic' }).click();
  await expect(page.getByRole('main')).toMatchAriaSnapshot(`
    - text: CV Analysis · No account required
    - heading "Your CV, finally matched to real jobs." [level=1]
    - paragraph: Upload your CV and get a complete diagnostic — match scores, skill gaps, and a ranked action plan based on live job listings.
    - text: Scroll to discover your gaps See what the analysis covers before you upload The problem
    - heading "You apply. You wait. You never find out why." [level=2]
    - paragraph: Most rejections have nothing to do with your qualifications — and everything to do with the gap between your CV and what the role actually needs.
    - heading "Applying blind" [level=3]
    - paragraph: You send the same CV to every listing without knowing which specific skills or framing are making you fall short.
    - heading "No honest feedback" [level=3]
    - paragraph: Rejections give you nothing. Generic AI tools give you encouragement — not a real gap analysis against actual job requirements.
    - heading "Effort without direction" [level=3]
    - paragraph: You have the experience. The problem is framing — and without a diagnostic, you can't fix what you can't see.
    - text: What you get
    - heading "A diagnostic report, not just a score." [level=2]
    - paragraph: CVClinic uses Retrieval-Augmented Generation to match your CV against live job listings — then builds a ranked plan of exactly what to change and why.
    - text: Job Match Score Example output
    - paragraph: Exact semantic overlap between your CV and real open roles — not a keyword count.
    - text: /React Developer \\d+% Frontend Developer \\d+% Full Stack Engineer \\d+% Skill Gaps Missing skills turned into concrete projects you can show employers\\. CV Fixes Specific rewrites for underselling sections — actual edits, not vague advice\\. Priority Action Plan/
    - paragraph: Ranked next steps ordered by market impact — know what to fix first, not a wall of bullet points.
    - text: "#1 Add TypeScript projects #2 Quantify impact metrics #3 Certify AWS basics #4 Show CI/CD experience How it works"
    - heading "Two ways to get your answer." [level=2]
    - paragraph: Upload your CV and choose how you want to analyse it.
    - text: /\\d+/
    - heading "Upload your CV" [level=3]
    - paragraph: /Drop a PDF or DOCX — up to \\d+ MB\\. We extract the text immediately\\. No account, no email required\\./
    - text: /\\d+/
    - heading "Choose your analysis mode" [level=3]
    - paragraph: Select the analysis path that matches your current job application strategy.
    - text: Best Matches
    - paragraph: We run your CV against our database of live job listings using RAG — and return ranked matches with a full score breakdown.
    - text: Ranked matches Skill gaps Action plan
    - img
    - text: Match a Job
    - paragraph: Found a role on LinkedIn or elsewhere? Paste the job description and we'll score your CV exclusively against that posting.
    - text: /Role-specific Targeted gaps Custom advice \\d+/
    - heading "Get your ranked action plan" [level=3]
    - paragraph: Receive match scores, skill gaps, specific CV edits, and a ranked list of what to fix — tailored to whichever mode you chose.
    - text: FAQ
    - heading "Frequently Asked Questions" [level=2]
    - paragraph: Find quick answers to common questions about CVClinic and how it processes your CV.
    - heading "How does the matching logic work?" [level=3]:
      - button "How does the matching logic work?"
    - heading "Is my resume data kept private?" [level=3]:
      - button "Is my resume data kept private?"
    - heading "What is the difference between the two modes?" [level=3]:
      - button "What is the difference between the two modes?"
    - text: Ready to analyze
    - heading "Analyze your CV" [level=2]
    - paragraph: Get your match score and action plan in seconds.
    - tablist:
      - tab "Best Matches" [selected]
      - tab "Match a Job"
    - text: Target Role (optional)
    - combobox: Software Engineer
    - text: /Drop your CV here PDF or DOCX • up to [\\d,.]+[bkmBKM]+ Or browse files/
    - button /Drop your CV here PDF or DOCX • up to [\\d,.]+[bkmBKM]+ Or browse files/
    - text: "Tip: if preview looks wrong, re-upload the file."
    - button "Analyze CV" [disabled]
    - paragraph: Processed securely. Use a redacted CV if you prefer not to share personal data.
    - text: Live job data AI-powered RAG Results in seconds
    `);
});

