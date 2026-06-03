import React from "react";

export type BookSort = "latest" | "bestseller" | "rating" | "price_asc" | "price_desc";

const BookSortSelect = ({ value, onChange }: { value: BookSort; onChange: (value: BookSort) => void }) => (
  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
    <span className="whitespace-nowrap">Sắp xếp:</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as BookSort)}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
    >
      <option value="bestseller">Bán chạy</option>
      <option value="rating">Đánh giá cao</option>
      <option value="price_asc">Giá thấp đến cao</option>
      <option value="price_desc">Giá cao đến thấp</option>
      <option value="latest">Mới nhất</option>
    </select>
  </label>
);

export default BookSortSelect;
