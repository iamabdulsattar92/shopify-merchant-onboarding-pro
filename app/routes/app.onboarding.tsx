import { useState, useCallback } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useNavigation, Form, useLoaderData } from "@remix-run/react";
import {
    Page,
    Layout,
    Card,
    FormLayout,
    TextField,
    Button,
    InlineStack,
    Box,
    Text,
    Banner,
    BlockStack,
    Divider,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const { session } = await authenticate.admin(request);

    // Check if profile already exists for this shop (assuming email/shop can identify them)
    // For now, we'll just check if there's any profile, or you could filter by email.
    const profile = await db.merchantProfile.findFirst({
        orderBy: { createdAt: 'desc' }
    });

    return json({ profile });
};

interface ActionErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    storeName?: string;
    form?: string;
}

interface ActionData {
    errors?: ActionErrors;
    success?: boolean;
}

export const action = async ({ request }: ActionFunctionArgs) => {
    await authenticate.admin(request);
    const formData = await request.formData();

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const storeName = formData.get("storeName") as string;

    // Validation
    const errors: ActionErrors = {};
    if (!firstName) errors.firstName = "First name is required";
    if (!lastName) errors.lastName = "Last name is required";
    if (!email) {
        errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
        errors.email = "Invalid email format";
    }
    if (!storeName) errors.storeName = "Store name is required";

    if (Object.keys(errors).length > 0) {
        return json({ errors }, { status: 400 });
    }

    try {
        await db.merchantProfile.create({
            data: {
                firstName,
                lastName,
                email,
                storeName,
            },
        });

        return redirect("/app?onboarding=success");
    } catch (error) {
        console.error("Failed to save merchant profile:", error);
        return json(
            { errors: { form: "Failed to save profile. Please check your database connection in pgAdmin." } },
            { status: 500 }
        );
    }
};

export default function OnboardingPage() {
    const { profile } = useLoaderData<typeof loader>();
    const actionData = useActionData<ActionData>();
    const navigation = useNavigation();
    const isSubmitting = navigation.state === "submitting";

    const [formState, setFormState] = useState({
        firstName: profile?.firstName || "",
        lastName: profile?.lastName || "",
        email: profile?.email || "",
        storeName: profile?.storeName || "",
    });

    const handleChange = useCallback(
        (value: string, id: string) =>
            setFormState((prev) => ({ ...prev, [id]: value })),
        []
    );

    return (
        <Page title="Onboarding" subtitle="Configure your merchant profile to sync with Postgres.">
            <Layout>
                <Layout.Section>
                    <BlockStack gap="500">
                        {actionData?.errors?.form && (
                            <Banner tone="critical" title="Database Error">
                                <p>{actionData.errors.form}</p>
                            </Banner>
                        )}

                        {profile && !actionData?.errors && (
                            <Banner tone="success" title="Profile Found">
                                <p>We already have a profile on file for <b>{profile.storeName}</b>. You can update it below.</p>
                            </Banner>
                        )}

                        <Card>
                            <Box padding="600">
                                <Form method="post">
                                    <FormLayout>
                                        <BlockStack gap="400">
                                            <Text as="h2" variant="headingLg">
                                                Merchant Information
                                            </Text>
                                            <Text as="p" variant="bodyMd" tone="subdued">
                                                Please enter the details you want to save to your local PostgreSQL database.
                                            </Text>
                                            <Divider />
                                        </BlockStack>

                                        <FormLayout.Group>
                                            <TextField
                                                label="First Name"
                                                name="firstName"
                                                value={formState.firstName}
                                                onChange={(val) => handleChange(val, "firstName")}
                                                error={actionData?.errors?.firstName}
                                                autoComplete="given-name"
                                                placeholder="John"
                                            />
                                            <TextField
                                                label="Last Name"
                                                name="lastName"
                                                value={formState.lastName}
                                                onChange={(val) => handleChange(val, "lastName")}
                                                error={actionData?.errors?.lastName}
                                                autoComplete="family-name"
                                                placeholder="Doe"
                                            />
                                        </FormLayout.Group>

                                        <TextField
                                            label="Email Address"
                                            name="email"
                                            type="email"
                                            value={formState.email}
                                            onChange={(val) => handleChange(val, "email")}
                                            error={actionData?.errors?.email}
                                            autoComplete="email"
                                            placeholder="john.doe@example.com"
                                            helpText="This email will be used for profile identification in your database."
                                        />

                                        <TextField
                                            label="Store Name"
                                            name="storeName"
                                            value={formState.storeName}
                                            onChange={(val) => handleChange(val, "storeName")}
                                            error={actionData?.errors?.storeName}
                                            autoComplete="organization"
                                            placeholder="My Shopify Store"
                                        />

                                        <Box paddingBlockStart="400">
                                            <InlineStack align="end" gap="300">
                                                <Button
                                                    submit
                                                    variant="primary"
                                                    loading={isSubmitting}
                                                    size="large"
                                                >
                                                    Save to Database
                                                </Button>
                                            </InlineStack>
                                        </Box>
                                    </FormLayout>
                                </Form>
                            </Box>
                        </Card>
                    </BlockStack>
                </Layout.Section>

                <Layout.Section variant="oneThird">
                    <Card>
                        <Box padding="400">
                            <BlockStack gap="300">
                                <Text as="h2" variant="headingMd">
                                    Database Sync Info
                                </Text>
                                <Text as="p" variant="bodyMd" tone="subdued">
                                    When you submit this form, Prisma will create a new entry in your <b>MerchantProfile</b> table in PostgreSQL.
                                </Text>
                                <Divider />
                                <Box>
                                    <Text as="p" variant="bodySm" tone="subdued">
                                        <b>Host:</b> localhost<br />
                                        <b>Port:</b> 5432<br />
                                        <b>Table:</b> MerchantProfile
                                    </Text>
                                </Box>
                            </BlockStack>
                        </Box>
                    </Card>
                </Layout.Section>
            </Layout>
        </Page>
    );
}
