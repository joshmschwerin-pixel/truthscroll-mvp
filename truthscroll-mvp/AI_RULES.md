# AI Rules for TruthScroll MVP

## App purpose
TruthScroll MVP is a Bible study web app focused on transparent scripture reading, search, study tools, AI-assisted Q&A, visual exploration, notes, highlights, and family discipleship content.

## Tech stack
- Next.js app using the App Router
- React for UI
- TypeScript for application code
- CSS via `app/globals.css`
- OpenAI for AI-powered Bible Q&A
- Supabase for auth, notes, highlights, and future data features
- Local JSON data files for Bible and study content
- React Flow for visual exploration features
- Node/Python scripts for DOCX conversion, OCR, and data normalization

## Coding rules
- Keep changes small, clear, and easy to review.
- Prefer server components by default; use `"use client"` only when needed.
- Use TypeScript for all app code.
- Reuse existing project patterns before introducing new ones.
- Preserve the Bible-study focus and transparent, careful tone of the product.
- Do not replace working data shapes or API response formats without a clear reason.

## Libraries to use
- Use `next` and `react` for app structure and UI.
- Use `@supabase/supabase-js` for auth and database-related features.
- Use `openai` for AI generation and question-answering features.
- Use `react-flow-renderer` only for graph, map, or relationship visualizations.
- Use local JSON files in `data/` for scripture, interlinear, lemma, and Strong’s-based content.
- Use the existing scripts in `scripts/` for DOCX import, OCR, and normalization tasks.

## What not to change without asking
- Do not change the overall app purpose or core module structure.
- Do not swap out Next.js, React, TypeScript, OpenAI, or Supabase.
- Do not rename or restructure major routes in `app/` without asking.
- Do not change core Bible data files or schema formats without asking.
- Do not remove existing auth, notes, highlights, or AI endpoints without asking.