drop policy if exists "catalog public read products" on public.products;
create policy "catalog public read products"
on public.products
for select
using (actif = true);

drop policy if exists "catalog public read categories" on public.product_categories;
create policy "catalog public read categories"
on public.product_categories
for select
using (true);

drop policy if exists "catalog public read price lists" on public.price_lists;
create policy "catalog public read price lists"
on public.price_lists
for select
using (active = true);

drop policy if exists "catalog public read price items" on public.price_list_items;
create policy "catalog public read price items"
on public.price_list_items
for select
using (
  exists (
    select 1
    from public.price_lists pl
    where pl.id = price_list_items.price_list_id
      and pl.active = true
  )
);

drop policy if exists "catalog public read product documents" on public.product_documents;
create policy "catalog public read product documents"
on public.product_documents
for select
using (
  exists (
    select 1
    from public.products p
    where p.id = product_documents.product_id
      and p.actif = true
  )
);

drop policy if exists "catalog public read clients" on public.clients;
create policy "catalog public read clients"
on public.clients
for select
using (type_fiche = 'client');

drop policy if exists "public read orders" on public.orders;
create policy "public read orders"
on public.orders
for select
using (true);

drop policy if exists "public insert orders" on public.orders;
create policy "public insert orders"
on public.orders
for insert
with check (
  exists (
    select 1
    from public.clients c
    where c.id = orders.client_id
      and c.type_fiche = 'client'
  )
);

drop policy if exists "public delete orders" on public.orders;
create policy "public delete orders"
on public.orders
for delete
using (true);

drop policy if exists "public insert order items" on public.order_items;
create policy "public insert order items"
on public.order_items
for insert
with check (
  exists (
    select 1
    from public.orders o
    where o.id = order_items.order_id
  )
);
