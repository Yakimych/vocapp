# Create T3 App

This is an app bootstrapped according to the [init.tips](https://init.tips) stack, also known as the T3-Stack.

## Image storage

Card images are stored on [Cloudinary](https://cloudinary.com) (free plan). Images pasted as a URL are copied there by the server on save. Uploaded files go from the browser straight to Cloudinary through a server-signed request.

The app needs one secret, `CLOUDINARY_URL`. It combines three credentials: the cloud name, the API key and the API secret.

1. Sign up for a free account at [cloudinary.com/users/register_free](https://cloudinary.com/users/register_free). No credit card is needed.
2. In the [Cloudinary Console](https://console.cloudinary.com), click the **Settings** (gear) icon in the left sidebar and open **API Keys**. The Dashboard's **Go to API Keys** button leads to the same page. The page shows:
   - **Cloud name**, which the Dashboard also shows.
   - **API Key**, in the key list. The **Root API key** is created with the account and has full access. Don't use it for the app. Click **Generate New API Key** to create a separate key. In the **Create API Key** dialog, choose the **Standard Development** usage type and the **Media Library User** role. A key with that role can't do anything until it gets a folder role, which step 3 grants.
   - **API Secret**, next to its key. It is hidden by default, so select it to make it visible before copying. Cloudinary may ask for your password first.
   - **API environment variable**, a template in the form `CLOUDINARY_URL=cloudinary://<your_api_key>:<your_api_secret>@<cloud_name>`. The cloud name is already filled in. You replace the two placeholders with the key and secret above.
3. Give the app's key the **Contributor** role on the `vocapp` folder. With this role the key can add images to that folder, but it can't delete or replace assets, see other folders or change settings. Without the role, every upload fails with `Request forbidden due to missing permissions (actions=["create"])`.

   The free plan offers only two roles for API keys: **Master Admin**, which grants full access to everything including settings, and **Media Library User**. Folder roles can be assigned to API keys only through the Admin API, so run this once, authenticated with the Root API key:
   ```
   read -s ADMIN               # paste <root_api_key>:<root_api_secret>, keeps it out of shell history
   CLOUD=<cloud_name>
   APP_KEY=<the app's api_key>

   # Create the folder (or create it at the root in the Media Library), then look up its external_id
   curl -X POST "https://$ADMIN@api.cloudinary.com/v1_1/$CLOUD/folders/vocapp"
   curl -s "https://$ADMIN@api.cloudinary.com/v1_1/$CLOUD/folders" | jq '.folders[] | select(.path == "vocapp")'
   FOLDER_ID=<external_id>

   # Grant the app's key the Contributor role on the folder
   curl "https://$ADMIN@api.cloudinary.com/v1_1/$CLOUD/folder_operations/invite/$FOLDER_ID" \
     -H "Content-Type: application/json" \
     -d "{\"principal\":{\"id\":\"$APP_KEY\",\"type\":\"apiKey\"},\"operation\":\"add\",\"roles\":[\"cld::role::folder::contributor\"]}"

   # Check: the app's key should be listed with the Contributor role
   curl -s "https://$ADMIN@api.cloudinary.com/v1_1/$CLOUD/folder_operations/invite/$FOLDER_ID" | jq
   ```
   The grant call returns `{"success":true}`. An `api_secret mismatch` error means `ADMIN` combines one key's ID with another key's secret. See [Cloudinary's folder_operations reference](https://cloudinary.com/documentation/admin_api_folder_operations) and the [folder role permissions](https://cloudinary.com/documentation/dam_admin_system_roles_permissions).
4. Locally, put the completed line in `.env.local`, which is gitignored. Don't put it in `.env`, because that file is committed:
   ```
   CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
   ```
5. In the hosting environment, set `CLOUDINARY_URL` as an app setting or secret. `yarn build` and `yarn lint` fail if it is missing.

Treat the API secret like a password. It never reaches the browser, because file uploads use a short-lived signature generated on the server. If the secret leaks, generate a new key on the **API Keys** page, update `CLOUDINARY_URL` everywhere, then deactivate the old key.

### Migrating existing images

`yarn migrate:images` copies the images of existing words to Cloudinary. It takes `DATABASE_URL` and `CLOUDINARY_URL` from the environment and from `.env*` files, using the same file precedence as `next build`.

The production database has already been migrated. [docs/image-migration.md](docs/image-migration.md) has the results and lists the words still left to fix.

- Words whose original image can no longer be fetched are left unchanged and listed at the end, so you can fix them on the Edit page.
- Re-running the script is safe, because images already on Cloudinary are skipped.
- Each migrated word is logged as `old -> new`. Save the output if you want to be able to restore the original URLs.

Against the local database:

```
yarn migrate:images --dry-run   # list what would be migrated
yarn migrate:images
```

Against the production database, take `DATABASE_URL` from Vercel:

```
vercel env pull .env.production.local --environment=production
sed -i '' '/^CLOUDINARY_URL=/d' .env.production.local
yarn migrate:images --dry-run
yarn migrate:images | tee migrate-images.log
rm .env.production.local
```

The `sed` step is required. `CLOUDINARY_URL` is a sensitive variable in Vercel, so `vercel env pull` writes it as an empty string. That empty value would otherwise take precedence over the real one in `.env.local`. The `sed -i ''` syntax is for macOS; on Linux, use `sed -i`.
