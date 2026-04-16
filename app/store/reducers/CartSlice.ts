'use client';

import { createSelector, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction, WritableDraft } from '@reduxjs/toolkit';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { IAttributeValues } from 'oneentry/dist/base/utils';
import type { ICartProduct } from '@/app/types/cart';

type CartState = {
  products: IProductsEntity[];
  productsData: ICartProduct[];
  total: number;
  version: number;
};

const initialState: CartState = {
  products: [],
  productsData: [],
  total: 0,
  version: 0,
};

export const cartSlice = createSlice({
  name: 'cart-slice',
  initialState,
  reducers: {
    addProductToCart(
      state: WritableDraft<CartState>,
      action: PayloadAction<{ id: number; quantity: number; selected?: boolean }>,
    ) {
      const index = state.productsData.findIndex((p) => p.id === action.payload.id);
      if (index === -1) {
        state.productsData.push({
          id: action.payload.id,
          quantity: Math.max(1, action.payload.quantity),
          selected: action.payload.selected ?? true,
        });
      } else {
        state.productsData[index]!.quantity = Math.max(
          1,
          state.productsData[index]!.quantity + action.payload.quantity,
        );
      }
    },

    increaseProductQty(
      state: WritableDraft<CartState>,
      action: PayloadAction<{ id: number; units: number }>,
    ) {
      const index = state.productsData.findIndex((p) => p.id === action.payload.id);
      if (index === -1) {
        state.productsData.push({ id: action.payload.id, quantity: 1, selected: true });
        return;
      }
      state.productsData[index]!.quantity = Math.min(
        state.productsData[index]!.quantity + 1,
        action.payload.units,
      );
    },

    decreaseProductQty(
      state: WritableDraft<CartState>,
      action: PayloadAction<{ id: number }>,
    ) {
      const index = state.productsData.findIndex((p) => p.id === action.payload.id);
      if (index === -1) return;
      if (state.productsData[index]!.quantity <= 1) {
        state.productsData = state.productsData.filter((p) => p.id !== action.payload.id);
      } else {
        state.productsData[index]!.quantity -= 1;
      }
    },

    setProductQty(
      state: WritableDraft<CartState>,
      action: PayloadAction<{ id: number; quantity: number; units: number }>,
    ) {
      if (action.payload.quantity <= 0) {
        state.productsData = state.productsData.filter((p) => p.id !== action.payload.id);
        return;
      }
      const qty = Math.min(action.payload.quantity, action.payload.units);
      const index = state.productsData.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.productsData[index]!.quantity = qty;
      } else {
        state.productsData.push({ id: action.payload.id, quantity: qty, selected: true });
      }
    },

    removeProduct(state: WritableDraft<CartState>, action: PayloadAction<number>) {
      state.productsData = state.productsData.filter((p) => p.id !== action.payload);
    },

    removeAllProducts(state: WritableDraft<CartState>) {
      state.productsData = [];
      state.products = [];
    },

    addProductsToCart(
      state: WritableDraft<CartState>,
      action: PayloadAction<IProductsEntity[]>,
    ) {
      state.products = action.payload;
    },

    deselectProduct(state: WritableDraft<CartState>, action: PayloadAction<number>) {
      const index = state.productsData.findIndex((p) => p.id === action.payload);
      if (index !== -1) {
        state.productsData[index]!.selected = !state.productsData[index]!.selected;
      }
    },

    setCartVersion(state: WritableDraft<CartState>, action: PayloadAction<number>) {
      state.version = action.payload;
    },
  },
});

export const selectCartData = (state: { cartReducer: CartState }) =>
  state.cartReducer.productsData;

export const selectCartItems = (state: { cartReducer: CartState }) =>
  state.cartReducer.products;

export const selectIsInCart = (
  state: { cartReducer: CartState },
  productId: number,
) => state.cartReducer.productsData.some((p) => p.id === productId);

export const selectCartItemQty = (
  state: { cartReducer: CartState },
  productId: number,
) => state.cartReducer.productsData.find((p) => p.id === productId)?.quantity ?? 0;

export const selectCartVersion = (state: { cartReducer: CartState }) =>
  state.cartReducer.version;

export const selectCartTotalQty = (state: { cartReducer: CartState }) =>
  state.cartReducer.productsData.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartTotal = createSelector(
  (state: { cartReducer: CartState }) => state.cartReducer.productsData,
  (state: { cartReducer: CartState }) => state.cartReducer.products,
  (productsData, products) =>
    productsData.reduce((total, item) => {
      if (!item.selected) return total;
      const product = products.find((p) => p.id === item.id);
      if (!product) return total;
      const attrs: IAttributeValues = product.attributeValues || {};
      const salePrice = attrs.sale?.value;
      const attrPrice = attrs.price?.value;
      const price = Number(salePrice ?? attrPrice ?? product.price ?? 0);
      return total + price * item.quantity;
    }, 0),
);

export const {
  addProductToCart,
  addProductsToCart,
  increaseProductQty,
  decreaseProductQty,
  setProductQty,
  removeProduct,
  deselectProduct,
  removeAllProducts,
  setCartVersion,
} = cartSlice.actions;

export default cartSlice.reducer;
