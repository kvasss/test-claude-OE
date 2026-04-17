# Changelog

## v 0.0.6

1) Сделай мне страницы на NextJS + Tailwindcss с товарами, страницу личного кабинет и страницу авторизации и регистрации

1) создай меню сверху со всеми ссылками на страницы

1) зачем ты написал этот тип?

Честно — напрасно создал. По правилу .claude/rules/typescript.md и памяти «использовать типы SDK напрямую» надо было возвращать IFormAttribute[] из getFormByMarker, а placeholder брать на клиенте из attr.additionalFields?.placeholder?.value

1) далее проанализируй файлы которые ты создал в этой сессии на подобные ошибки и так же измени коди правила

## v 0.0.7

1) сделай авторизацию и регистрацию oauth

1) на главной странице выведи блоки с главной страницы из админки

## v 0.0.8

1) сделай страницу товара

Триггер «страницу товара» → скилл /create-product-page. Папка app/products/[id] уже создана (пустая). Атрибуты товара известны из предыдущей инспекции (pic, price, sale, description, more_pic, color, stickers, sku, units_product, currency).

Страница товара app/products/[id]/page.tsx:

Галерея components/product/ProductGallery.tsx — клиентский компонент с переключением между pic + more_pic
Инфо-блок: стикеры (stickers с иконками), название, SKU, цена + sale с процентом скидки, выбор цвета (color с hex из extended), статус наличия + units_product, кнопка «В корзину» (disabled если не в наличии)
Описание из attrs.description.value.htmlValue через dangerouslySetInnerHTML
Похожие товары через getRelatedProductsById (4 штуки)
