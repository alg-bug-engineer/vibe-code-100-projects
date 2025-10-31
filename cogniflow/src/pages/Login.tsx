import { LocalLoginPanel } from "@/components/auth/LocalLoginPanel";

const login_config = {
  title: 'CogniFlow',
  desc: '智能流笔记 - 你只管记录,我负责管理',
  privacyPolicyUrl: import.meta.env.VITE_PRIVACY_POLICY_URL,
  userPolicyUrl: import.meta.env.VITE_USER_POLICY_URL,
  showPolicy: import.meta.env.VITE_SHOW_POLICY,
  policyPrefix: import.meta.env.VITE_POLICY_PREFIX,
};

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md">
        <LocalLoginPanel {...login_config} />
      </div>
    </div>
  );
}
