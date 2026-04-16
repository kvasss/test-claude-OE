'use client';

import { useDispatch, useSelector } from 'react-redux';
import {
  addProductToCart,
  decreaseProductQty,
  increaseProductQty,
  selectCartItemQty,
  selectIsInCart,
} from '@/app/store/reducers/CartSlice';
import type { AppDispatch, RootState } from '@/app/store/store';

type Props = {
  productId: number;
  units?: number;
};

export function AddToCartButton({ productId, units = 99 }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const isInCart = useSelector((s: RootState) => selectIsInCart(s, productId));
  const qty = useSelector((s: RootState) => selectCartItemQty(s, productId));

  if (!isInCart) {
    return (
      <button
        type="button"
        onClick={() => dispatch(addProductToCart({ id: productId, quantity: 1 }))}
        className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition"
      >
        В корзину
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1">
      <button
        type="button"
        onClick={() => dispatch(decreaseProductQty({ id: productId }))}
        className="h-8 w-8 rounded-md bg-white text-indigo-700 font-semibold hover:bg-indigo-100"
        aria-label="Уменьшить количество"
      >
        −
      </button>
      <span className="text-sm font-medium text-indigo-900">{qty} шт.</span>
      <button
        type="button"
        onClick={() => dispatch(increaseProductQty({ id: productId, units }))}
        className="h-8 w-8 rounded-md bg-white text-indigo-700 font-semibold hover:bg-indigo-100"
        aria-label="Увеличить количество"
      >
        +
      </button>
    </div>
  );
}
