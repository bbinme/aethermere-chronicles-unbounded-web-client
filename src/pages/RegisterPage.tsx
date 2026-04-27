import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login, register as apiRegister } from '@/api/auth';
import { ApiError } from '@/api/errors';
import { useAuth } from '@/auth/useAuth';

const schema = z
  .object({
    username: z.string().min(1, 'Required'),
    email: z.email('Invalid email'),
    password: z.string().min(1, 'Required'),
    confirm: z.string().min(1, 'Required'),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    message: 'Passwords must match',
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const { setAccessToken } = useAuth();
  const nav = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      await apiRegister({
        username: values.username,
        email: values.email,
        password: values.password,
      });
      const auth = await login({ username: values.username, password: values.password });
      setAccessToken(auth.accessToken);
      nav('/', { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        setSubmitError('Username already taken');
      } else {
        setSubmitError('Something went wrong; please try again');
      }
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 space-y-6">
      <h1 className="text-3xl">Create account</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <Label htmlFor="username">Username</Label>
          <Input id="username" autoComplete="username" {...register('username')} />
          {errors.username && (
            <p role="alert" className="text-destructive text-sm">
              {errors.username.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && (
            <p role="alert" className="text-destructive text-sm">
              {errors.email.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            {...register('password')}
          />
          {errors.password && (
            <p role="alert" className="text-destructive text-sm">
              {errors.password.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            {...register('confirm')}
          />
          {errors.confirm && (
            <p role="alert" className="text-destructive text-sm">
              {errors.confirm.message}
            </p>
          )}
        </div>
        {submitError && (
          <p role="alert" className="text-destructive text-sm">
            {submitError}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p>
        Already have an account?{' '}
        <Link to="/login" className="text-primary underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
