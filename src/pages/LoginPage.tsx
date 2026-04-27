import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/api/auth';
import { ApiError } from '@/api/errors';
import { useAuth } from '@/auth/useAuth';

const schema = z.object({
  username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
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
      const res = await login(values);
      setAccessToken(res.accessToken);
      nav('/', { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setSubmitError('Invalid credentials');
      } else {
        setSubmitError('Something went wrong; please try again');
      }
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-20 space-y-6">
      <h1 className="text-3xl">Sign in</h1>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register('password')}
          />
          {errors.password && (
            <p role="alert" className="text-destructive text-sm">
              {errors.password.message}
            </p>
          )}
        </div>
        {submitError && (
          <p role="alert" className="text-destructive text-sm">
            {submitError}
          </p>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <p>
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-primary underline">
          Register
        </Link>
      </p>
    </div>
  );
}
