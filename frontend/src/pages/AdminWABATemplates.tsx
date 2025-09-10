

import { useState } from "react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "../components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { AdminLayout } from "../components/AdminLayout";
import { MessageSquare, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";

interface WABATemplate {
  id: string;
  name: string;
  category: string;
  language: string;
  status: "APPROVED" | "PENDING" | "REJECTED" | "DRAFT";
  content: string;
  variables: string[];
  created_at: string;
  updated_at: string;
  usage_count: number;
}

const AdminWABATemplates = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Static stub data for WABA templates
  const templates: WABATemplate[] = [
    {
      id: "tpl_001",
      name: "Appointment Confirmation",
      category: "UTILITY",
      language: "en",
      status: "APPROVED",
      content: "Hello {{1}}, your appointment with Dr. {{2}} is confirmed for {{3}} at {{4}}. Reply CANCEL to cancel.",
      variables: ["patient_name", "doctor_name", "date", "time"],
      created_at: "2025-08-15T10:00:00Z",
      updated_at: "2025-08-15T10:00:00Z",
      usage_count: 247
    },
    {
      id: "tpl_002",
      name: "Payment Reminder",
      category: "UTILITY",
      language: "en",
      status: "APPROVED",
      content: "Hi {{1}}, your payment of ${{2}} for invoice #{{3}} is due on {{4}}. Pay now: {{5}}",
      variables: ["customer_name", "amount", "invoice_number", "due_date", "payment_link"],
      created_at: "2025-08-14T14:30:00Z",
      updated_at: "2025-08-16T09:15:00Z",
      usage_count: 89
    },
    {
      id: "tpl_003",
      name: "Order Status Update",
      category: "UTILITY",
      language: "en",
      status: "APPROVED",
      content: "Your order #{{1}} has been {{2}}. Track your package: {{3}}",
      variables: ["order_number", "status", "tracking_link"],
      created_at: "2025-08-13T16:45:00Z",
      updated_at: "2025-08-13T16:45:00Z",
      usage_count: 156
    },
    {
      id: "tpl_004",
      name: "Welcome Message",
      category: "MARKETING",
      language: "en",
      status: "PENDING",
      content: "Welcome to {{1}}! We're excited to have you. Get 20% off your first purchase with code WELCOME20.",
      variables: ["company_name"],
      created_at: "2025-08-12T11:20:00Z",
      updated_at: "2025-08-12T11:20:00Z",
      usage_count: 0
    },
    {
      id: "tpl_005",
      name: "Support Ticket Created",
      category: "UTILITY",
      language: "en",
      status: "APPROVED",
      content: "Support ticket #{{1}} has been created. Our team will respond within {{2}} hours. Reference: {{3}}",
      variables: ["ticket_number", "response_time", "reference_code"],
      created_at: "2025-08-10T09:00:00Z",
      updated_at: "2025-08-10T09:00:00Z",
      usage_count: 34
    },
    {
      id: "tpl_006",
      name: "Prescription Ready",
      category: "UTILITY",
      language: "en",
      status: "DRAFT",
      content: "Your prescription for {{1}} is ready for pickup at {{2}}. Pharmacy hours: {{3}}",
      variables: ["medication_name", "pharmacy_name", "hours"],
      created_at: "2025-08-09T13:30:00Z",
      updated_at: "2025-08-09T13:30:00Z",
      usage_count: 0
    }
  ];

  const categories = ["all", "UTILITY", "MARKETING", "AUTHENTICATION"];
  const statuses = ["all", "APPROVED", "PENDING", "REJECTED", "DRAFT"];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || template.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: WABATemplate['status']) => {
    const variants = {
      APPROVED: "default",
      PENDING: "secondary",
      REJECTED: "destructive",
      DRAFT: "outline"
    } as const;
    
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">WABA Templates</h1>
          <p className="text-muted-foreground">Manage WhatsApp Business API message templates</p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">Search</label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-40">
                <label className="text-sm font-medium">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-40">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === "all" ? "All Statuses" : status}
                    </option>
                  ))}
                </select>
              </div>
              <Button disabled>
                New Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Templates ({filteredTemplates.length})
            </CardTitle>
            <CardDescription>
              WhatsApp Business API message templates for automated communications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Template</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Category</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Language</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Variables</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Usage</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Updated</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">
                      <div>
                        <div className="font-medium">{template.name}</div>
                        <div className="text-sm text-gray-600 font-mono truncate max-w-xs">
                          {template.content}
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Badge variant="outline">{template.category}</Badge>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 uppercase text-xs font-mono">
                      {template.language}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {getStatusBadge(template.status)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="text-xs">
                        {template.variables.length} vars
                        {template.variables.length > 0 && (
                          <div className="text-gray-600 font-mono mt-1">
                            {template.variables.slice(0, 2).join(", ")}
                            {template.variables.length > 2 && "..."}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {template.usage_count.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-xs text-gray-600">
                      {new Date(template.updated_at).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" disabled>
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" disabled>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="ghost" disabled>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredTemplates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm || selectedCategory !== "all" || selectedStatus !== "all" 
                  ? "No templates match the current filters"
                  : "No templates available"
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminWABATemplates;
