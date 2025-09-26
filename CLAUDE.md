# Feedback Context Feature - Implementation Plan

## Overview
This feature allows feedback submitters to provide additional context to prove they understand the receiver's worldview or know them well, without revealing their identity. This context helps establish credibility and encourages receivers to take feedback more seriously.

## Database Schema Changes

### 1. Add columns to `feedback` table:
```sql
-- Add encrypted context column to feedback table
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS encrypted_context TEXT;

-- Add constraint for context length
ALTER TABLE public.feedback 
ADD CONSTRAINT IF NOT EXISTS encrypted_context_length 
CHECK (length(encrypted_context) <= 20000);
```

### 2. Add columns to `scheduled_feedback` table:
```sql
-- Add encrypted context column to scheduled_feedback table  
ALTER TABLE public.scheduled_feedback
ADD COLUMN IF NOT EXISTS encrypted_context TEXT;

-- Add constraint for context length
ALTER TABLE public.scheduled_feedback
ADD CONSTRAINT IF NOT EXISTS sched_encrypted_context_length
CHECK (length(encrypted_context) <= 20000);
```

### 3. Add user preference to `users` table:
```sql
-- Add setting to enable/disable context proof field
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS context_proof_enabled BOOLEAN NOT NULL DEFAULT true;
```

## Component Updates

### 1. Feedback Submission Page (`app/f/[token]/page.tsx`)

**Changes needed:**
- Add new state for context field: `const [context, setContext] = useState("");`
- Add new state to track if context is enabled: `const [contextProofEnabled, setContextProofEnabled] = useState<boolean>(true);`
- Fetch `context_proof_enabled` setting in the resolve-token API call
- Add context textarea below the main feedback textarea with conditional rendering based on `contextProofEnabled`
- Include context in the submission payload (both encrypted and plain versions)
- Update character limit checks to include context (suggest 500 char limit)
- Display helper text: "Help them take your feedback seriously by proving you understand their goals or know them well (optional)"

### 2. API Routes

#### `/api/feedback/resolve-token` route:
- Include `context_proof_enabled` in the response data

#### `/api/feedback/submit` route:
- Accept `context` field in request body
- Accept `encrypted_context` field for encrypted submissions
- Encrypt context using the same method as feedback content
- Store encrypted_context in both `feedback` and `scheduled_feedback` tables

#### `/api/feedback/analyze` route (AI Coach):
- Optionally analyze context for personally identifying information
- Provide suggestions to improve context anonymity if needed

### 3. Dashboard Page (`app/dashboard/page.tsx`)

**Changes needed:**
- Update `Feedback` and `DecryptedFeedback` interfaces to include `encrypted_context` and `context`
- Decrypt context alongside content and reasoning
- Display context in the feedback cards (perhaps as an expandable section or tooltip)
- Style context distinctively from main feedback

### 4. Settings Page (`app/settings/page.tsx`)

**Changes needed:**
- Add toggle for "Context Proof Field" with explanation
- Default state: enabled
- Description: "Allow feedback submitters to prove they understand your goals or know you well"
- Save preference via `/api/settings/update` endpoint

### 5. API Settings Update (`/api/settings/update`)
- Handle `context_proof_enabled` field updates

## Implementation Steps

### Phase 1: Database Setup
1. Create and run migration script with all schema changes
2. Test database constraints

### Phase 2: Backend Implementation
1. Update API routes to handle context field
2. Implement encryption/decryption for context
3. Update feedback submission logic
4. Update scheduled feedback logic

### Phase 3: Frontend Implementation  
1. Add context field to submission form
2. Update dashboard to display context
3. Add settings toggle
4. Implement proper styling and UX

### Phase 4: Testing & Polish
1. Test full encryption/decryption flow
2. Test with context enabled/disabled
3. Test scheduled feedback with context
4. Test character limits and validation
5. Test AI coach integration if applicable

## Security Considerations

1. **Encryption**: Context must be encrypted using the same RSA public key encryption as feedback content
2. **Length limits**: Enforce reasonable character limits (500 chars suggested)
3. **Rate limiting**: Existing rate limits apply to submissions with context
4. **Anonymity**: Context should not leak sender identity - AI coach can help review

## UX Considerations

1. **Optional by default**: Context field should be clearly marked as optional
2. **Helper text**: Provide clear guidance on what makes good context
3. **Examples**: Consider showing examples like:
   - "I've worked with you on multiple projects and understand your focus on user experience"
   - "I know you value efficiency and direct communication"
   - "We've discussed your goals around scaling the team"
4. **Character counter**: Show remaining characters as user types
5. **Placement**: Position below main feedback but above scheduling options

## Default Settings

- `context_proof_enabled`: true (enabled by default)
- Not shown during initial account setup
- Can be disabled in settings after account creation
- When disabled, the field is hidden from the submission form

## Suggested UI Text

**Field Label**: "Why should they take your feedback seriously? (optional)"

**Helper Text**: "Without revealing who you are, explain why you understand their situation, goals, or perspective. This helps establish credibility while maintaining anonymity."

**Placeholder**: "e.g., I understand your focus on... / I know you value... / We've discussed your goals around..."

## Migration Rollback Plan

If issues arise, rollback by:
1. Remove new columns from database
2. Deploy previous version of application
3. Clear any cached data

## Success Metrics

- Users engage with context field (>30% usage rate)
- Feedback with context has higher engagement/response rate
- No increase in identity leaks
- No significant increase in submission friction

## Next Steps After Implementation

1. Monitor usage analytics
2. Gather user feedback on the feature
3. Consider AI-powered suggestions for context writing
4. Potentially add context templates or examples