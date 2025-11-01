import { RegisterPanel } from "@/components/auth/RegisterPanel";

const register_config = {
  title: 'CogniFlow 注册',
  desc: '创建您的账户，开始智能流笔记之旅'
};

export default function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-md">
        <RegisterPanel {...register_config} />
      </div>
    </div>
  );
}