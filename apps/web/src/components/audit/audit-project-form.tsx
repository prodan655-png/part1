import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

const formSchema = z.object({
    gscProperty: z.string().min(1, 'GSC Property is required'),
    targetCountry: z.string().min(2, 'Country code is required'),
    maxPages: z.coerce.number().min(10).max(10000),
});

interface AuditProjectFormProps {
    siteId: string;
    onSuccess?: () => void;
}

export function AuditProjectForm({ siteId, onSuccess }: AuditProjectFormProps) {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            gscProperty: '',
            targetCountry: 'us',
            maxPages: 100,
        },
    });

    const mutation = useMutation({
        mutationFn: async (values: z.infer<typeof formSchema>) => {
            const response = await api.post(`/sites/${siteId}/audit-project`, values);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sites', siteId] });
            queryClient.invalidateQueries({ queryKey: ['audit-project', siteId] });
            if (onSuccess) onSuccess();
        },
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        mutation.mutate(values);
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Audit Configuration</CardTitle>
                <CardDescription>
                    Configure how we should audit this site. Connect to Google Search Console for best results.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="gscProperty"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Google Search Console Property</FormLabel>
                                    <FormControl>
                                        <Input placeholder="sc-domain:example.com" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Enter the GSC property URL or domain (e.g., https://example.com/ or sc-domain:example.com)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="targetCountry"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Country</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a country" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="us">United States</SelectItem>
                                                <SelectItem value="uk">United Kingdom</SelectItem>
                                                <SelectItem value="ca">Canada</SelectItem>
                                                <SelectItem value="au">Australia</SelectItem>
                                                <SelectItem value="de">Germany</SelectItem>
                                                <SelectItem value="fr">France</SelectItem>
                                                <SelectItem value="es">Spain</SelectItem>
                                                <SelectItem value="it">Italy</SelectItem>
                                                <SelectItem value="ua">Ukraine</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Primary target audience location.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="maxPages"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Page Limit</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            Maximum number of pages to analyze.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? 'Creating Project...' : 'Start Audit Project'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
