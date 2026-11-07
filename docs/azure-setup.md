# Project Society: Azure setup, step by step

This takes about 30–45 minutes. You don't install anything on your computer. Everything happens in a web browser on three websites:

- **Azure portal**: https://portal.azure.com, where your app's servers live
- **GitHub**: https://github.com/jayfitzhenry/ProjectSociety, where your code lives
- **Claude Code**: builds the new app at the end

You'll need the four files that came with this guide:

| File | What it is |
| :--- | :--- |
| `main.bicep` | A recipe that tells Azure what to create |
| `deploy.yml` | Instructions GitHub follows to copy your app to Azure every time you change it |
| `azure-setup.md` | This guide |
| `claude-code-build-prompt.md` | The instructions you'll give Claude Code |

Do the parts in order. Each one depends on the one before.

---

## Part 1: Get an Azure subscription (5 min)

A *subscription* is your Azure account that holds resources and sends any bills. Use a personal one, not a work one: you don't want your game tied to your employer's account.

1. Go to https://portal.azure.com and sign in with a personal Microsoft account (Outlook, Hotmail or Xbox).
2. In the search bar at the top, type **Subscriptions** and open it.
3. **If you see a subscription listed** (status *Active*), note its name and go to Part 2.
4. **If the list is empty**, go to https://azure.microsoft.com/free and sign up. It asks for a card to confirm who you are. Everything in this guide sits in free tiers, and Part 5 sets an alert in case anything starts costing money.

---

## Part 2: Create the Azure resources (10 min)

You'll use **Cloud Shell**, a command line that runs inside the Azure website, so there's nothing to install.

### 2a. Open Cloud Shell

1. In the Azure portal, click the **Cloud Shell** icon in the top bar. It looks like `>_` and sits to the right of the search bar.
2. A panel opens at the bottom of the screen. If it asks **Bash or PowerShell**, choose **Bash**.
3. If it asks about storage, choose **No storage account required**, pick your subscription, and click **Apply**.
4. Wait until you see a prompt ending in `$`.

### 2b. Upload the recipe file

1. In the Cloud Shell toolbar, click **Manage files** (or the upload/download icon), then **Upload**.
2. Choose `main.bicep` from your computer.
3. To check it arrived, type the command below and press **Enter**:
   ```sh
   ls
   ```
   You should see `main.bicep` in the list.

### 2c. Run the commands

Copy each block, paste it into Cloud Shell (right-click › Paste, or Ctrl+Shift+V), and press **Enter**. Wait for each to finish before starting the next.

**1. Create a resource group.** This is a folder that holds everything for this app, so you can find it, or delete it, in one place.
```sh
az group create --name rg-projectsociety --location westeurope
```
You should see text containing `"provisioningState": "Succeeded"`.

**2. Create the website and database.** This takes 5–10 minutes. Leave it running.
```sh
az deployment group create --resource-group rg-projectsociety --template-file main.bicep
```
When it finishes, scroll up a little. You should see `"provisioningState": "Succeeded"` and, under `outputs`, a `siteUrl`. That's your app's web address. Copy it somewhere.

### If step 2 fails

| Error message mentions | What it means | Fix |
| :--- | :--- | :--- |
| `free tier` | This subscription already has its one free Cosmos DB database account | Run the command again with `--parameters cosmosFreeTier=false` added on the end. The database will then cost a little each month; Part 5's alert will tell you how much. |
| `MissingSubscriptionRegistration` | Your subscription hasn't used these services before | Run `az provider register --namespace Microsoft.Web` and `az provider register --namespace Microsoft.DocumentDB`, wait 2 minutes, then repeat step 2. |
| `RequestDisallowedByPolicy` | You're in a work or student subscription that blocks this | Use a personal subscription (Part 1). |

---

## Part 3: Connect GitHub to Azure (5 min)

GitHub needs a password-like key, called a **deployment token**, to send your app to Azure. You'll copy it from Azure and store it in GitHub as a **secret**, a value GitHub keeps hidden.

### 3a. Copy the token from Azure

1. In the Azure portal search bar, type **projectsociety-web** and open it. (Its type is *Static Web App*.)
2. On its **Overview** page, click **Manage deployment token** in the toolbar along the top.
3. Click the copy icon next to the token. Don't paste it anywhere except the next step.

### 3b. Save it in GitHub

1. Go to https://github.com/jayfitzhenry/ProjectSociety.
2. Click **Settings** (top tabs, far right).
3. In the left menu, click **Secrets and variables › Actions**.
4. Click **New repository secret**.
5. **Name:** `AZURE_STATIC_WEB_APPS_API_TOKEN` (exactly this, it must match the workflow file).
6. **Secret:** paste the token.
7. Click **Add secret**.

---

## Part 4: Add the files to GitHub and deploy (10 min)

Adding these files to the repo starts the first deployment straight away. That's why Part 3 had to come first.

### 4a. Create each file in GitHub

Do this three times, once per row of the table:

1. On your repo's main page, click **Add file › Create new file**.
2. In the filename box, type the path from the table. Typing a `/` creates a folder, so you'll see the path split into folders as you type.
3. Open the matching file on your computer, select all (Ctrl+A), copy, and paste it into the big editing box.
4. Click **Commit changes…**, leave the defaults, and click **Commit changes** again.

| Type this filename | Paste the contents of |
| :--- | :--- |
| `infra/main.bicep` | `main.bicep` |
| `docs/azure-setup.md` | `azure-setup.md` |
| `.github/workflows/deploy.yml` | `deploy.yml` (do this one last) |

Note the dot at the start of `.github`. It's required.

### 4b. Watch it deploy

1. Click the **Actions** tab in your repo.
2. You'll see a run called **Test and deploy to Azure**. A yellow dot means it's running. Wait for a green tick (2–4 minutes).
3. Open the `siteUrl` you copied in Part 2. You should see your current Project Society app, now on Azure.

If you get a **red cross** instead, click the run, then the failed job, and read the red lines. The usual cause is a misnamed secret: go back to Part 3b and check the name matches exactly.

---

## Part 5: Set a spending alert (3 min)

Do this so a mistake can't quietly cost you money.

1. In the Azure portal search bar, type **Budgets** and open **Cost Management | Budgets**.
2. Click **Add**. Check that **Scope** shows your subscription; you can narrow it to `rg-projectsociety`.
3. **Name:** `projectsociety`. **Reset period:** Monthly. **Amount:** `5`.
4. Click **Next**. Add an alert condition: **Actual**, **80**%. Enter your email address.
5. Click **Create**.

---

## Part 6: Build the new app with Claude Code

1. Add the last file to GitHub the same way as Part 4a: filename `docs/claude-code-build-prompt.md`, contents of `claude-code-build-prompt.md`.
2. Start a Claude Code session on the `jayfitzhenry/ProjectSociety` repo, either at https://claude.ai/code or in a terminal on your computer.
3. Open `claude-code-build-prompt.md` and copy everything **below the line** (from "You're turning Project Society…" to the end).
4. Paste it into Claude Code and send.
5. Claude Code reads the repo and replies with a **plan and some questions**. It won't write code yet. Read the plan, answer the questions, and say "approved" when you're happy.
6. It then builds in five phases. After each phase, it commits the work. Every commit to `main` deploys automatically, so after each phase you can open your `siteUrl` and try it.

### Things to check after phase 1

- Opening the site sends you to a sign-in page.
- You can sign in with your Microsoft account.
- In the repo, `.github/workflows/deploy.yml` now says `api_location: "api"`. The prompt tells Claude Code to change this; if it hasn't, ask it to.

---

## Once the new app is working

Turn off the old GitHub Pages copy, so there's only one version:

1. Repo **Settings › Pages**.
2. Under **Build and deployment › Source**, choose **None**, or click **Unpublish site** if that's shown.

---

## Extras (not needed day to day)

### Try the app on your own computer

Only needed if you want to test changes before they go live. Claude Code will set this up and explain it in phase 5.

```sh
npm install -g @azure/static-web-apps-cli azure-functions-core-tools@4
swa start . --api-location api
```

### Replace the database key

Do this if the key ever leaks. Run these in Cloud Shell (upload `main.bicep` again if Cloud Shell has been reset):

```sh
az cosmosdb list -g rg-projectsociety --query "[].name" -o tsv
az cosmosdb keys regenerate -g rg-projectsociety -n <name from the line above> --key-kind primary
az deployment group create -g rg-projectsociety --template-file main.bicep
```

The last command puts the new key into the app's settings.

### Things the free setup can't do

- **Sign-in is Microsoft or GitHub accounts only.** Google, Discord or email sign-up needs the Standard plan, about $9 a month.
- **No uptime guarantee.** Fine for a hobby game.
- **No preview sites for unfinished work.** These are off on purpose: a preview would use the same database as the live site, so half-built code could damage real characters.
