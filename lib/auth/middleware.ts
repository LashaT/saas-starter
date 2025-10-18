/**
 * AUTHENTICATION MIDDLEWARE & VALIDATION
 * 
 * This file provides higher-order functions for creating secure server actions
 * with built-in authentication, validation, and error handling.
 * 
 * Key Concepts for Junior Developers:
 * - Higher-Order Functions: Functions that return other functions
 * - Server Actions: Secure server-side functions for form handling
 * - Input Validation: Using Zod schemas to validate form data
 * - Authentication Guards: Ensure only logged-in users can access functions
 * - Team Context: Provide team data to actions that need it
 * 
 * Security Features:
 * - Automatic user authentication checks
 * - Input validation with Zod schemas
 * - Type-safe form data handling
 * - Automatic redirects for unauthenticated users
 */

import { z } from 'zod';
import { TeamDataWithMembers, User } from '@/lib/db/schema';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { redirect } from 'next/navigation';

/**
 * Standard return type for server actions
 * Used for form state management and error handling
 */
export type ActionState = {
  error?: string;      // Error message to display to user
  success?: string;    // Success message to display to user
  [key: string]: any; // Allow additional properties for flexibility
};

/**
 * Function type for validated actions
 * Takes validated data and form data, returns action result
 */
type ValidatedActionFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,    // Validated and typed form data
  formData: FormData   // Raw form data (for files, etc.)
) => Promise<T>;

/**
 * Creates a server action with automatic input validation
 * 
 * @param schema - Zod schema for form validation
 * @param action - Function to execute with validated data
 * @returns Server action function
 * 
 * Usage:
 * ```typescript
 * const createUserAction = validatedAction(
 *   z.object({ email: z.string().email(), name: z.string() }),
 *   async (data) => {
 *     // data is now typed and validated
 *     return await createUser(data);
 *   }
 * );
 * ```
 */
export function validatedAction<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    // Validate form data against schema
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    // Execute action with validated data
    return action(result.data, formData);
  };
}

/**
 * Function type for validated actions that require authentication
 * Includes user data for actions that need to know who is performing them
 */
type ValidatedActionWithUserFunction<S extends z.ZodType<any, any>, T> = (
  data: z.infer<S>,    // Validated form data
  formData: FormData,  // Raw form data
  user: User          // Authenticated user data
) => Promise<T>;

/**
 * Creates a server action with validation AND authentication
 * 
 * @param schema - Zod schema for form validation
 * @param action - Function to execute with validated data and user
 * @returns Server action function that requires authentication
 * 
 * Usage:
 * ```typescript
 * const updateProfileAction = validatedActionWithUser(
 *   z.object({ name: z.string() }),
 *   async (data, formData, user) => {
 *     // user is guaranteed to be authenticated
 *     return await updateUserProfile(user.id, data);
 *   }
 * );
 * ```
 */
export function validatedActionWithUser<S extends z.ZodType<any, any>, T>(
  schema: S,
  action: ValidatedActionWithUserFunction<S, T>
) {
  return async (prevState: ActionState, formData: FormData) => {
    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      throw new Error('User is not authenticated');
    }

    // Validate form data
    const result = schema.safeParse(Object.fromEntries(formData));
    if (!result.success) {
      return { error: result.error.errors[0].message };
    }

    // Execute action with validated data and user context
    return action(result.data, formData, user);
  };
}

/**
 * Function type for actions that require team context
 * Provides team data including all team members
 */
type ActionWithTeamFunction<T> = (
  formData: FormData,        // Raw form data
  team: TeamDataWithMembers  // Team data with all members
) => Promise<T>;

/**
 * Creates a server action that requires team context
 * 
 * @param action - Function to execute with team data
 * @returns Server action function that requires team membership
 * 
 * Security: Automatically checks authentication and team membership
 * 
 * Usage:
 * ```typescript
 * const inviteMemberAction = withTeam(async (formData, team) => {
 *   // team is guaranteed to exist and user is a member
 *   return await inviteTeamMember(team.id, formData.get('email'));
 * });
 * ```
 */
export function withTeam<T>(action: ActionWithTeamFunction<T>) {
  return async (formData: FormData): Promise<T> => {
    // Check if user is authenticated
    const user = await getUser();
    if (!user) {
      redirect('/sign-in');  // Redirect to login if not authenticated
    }

    // Get user's team data
    const team = await getTeamForUser();
    if (!team) {
      throw new Error('Team not found');
    }

    // Execute action with team context
    return action(formData, team);
  };
}
