"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  label: string;
  pendingLabel?: string;
  className?: string;
  pendingHint?: string;
};

export function SubmitButton({
  label,
  pendingLabel = "提交中...",
  className,
  pendingHint = "提交处理中，请勿重复点击。",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <div className="space-y-2">
      <button className={className} type="submit" disabled={pending}>
        {pending ? pendingLabel : label}
      </button>
      <p className="submit-hint" aria-live="polite">
        {pending ? pendingHint : ""}
      </p>
    </div>
  );
}
