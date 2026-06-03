import { ArrowLeft, SearchX } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="max-w-lg mx-auto py-20 text-center">
    <SearchX className="h-14 w-14 text-indigo-500 mx-auto" />
    <h1 className="mt-5 text-3xl font-bold text-gray-950">Không tìm thấy trang</h1>
    <p className="mt-2 text-gray-500">Đường dẫn bạn truy cập không tồn tại hoặc đã được thay đổi.</p>
    <Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700">
      <ArrowLeft className="h-4 w-4" /> Về trang chủ
    </Link>
  </div>
);

export default NotFound;
