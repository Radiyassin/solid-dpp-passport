import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Clock,
  FileText,
  Globe,
  MapPin,
  Tag,
  ExternalLink,
  User,
  Phone,
  Mail,
  Building,
  File,
  Shield,
  Download,
  Eye
} from 'lucide-react';

interface AssetDetailsCardProps {
  asset?: {
    id: string;
    title: string;
    description: string;
    createdDate: Date;
    lastModified: Date;
    dataFormat: string;
    categories: string[];
    language: string;
    metadataLanguage: string;
    chargeable: boolean;
    temporalCoverageStart?: Date;
    temporalCoverageEnd?: Date;
    geographicCoverage: string;
    updateFrequency: string;
    sourceUrl?: string;
  };
}

export default function AssetDetailsCard({ asset }: AssetDetailsCardProps) {
  const [isChargeable, setIsChargeable] = useState(asset?.chargeable || false);

  // Mock data if no asset provided
  const defaultAsset = {
    id: 'asset-001',
    title: 'Product Sustainability Metrics Dataset',
    description: 'Comprehensive dataset containing sustainability metrics for electronic products including carbon footprint, material composition, and lifecycle assessments.',
    createdDate: new Date('2024-01-15'),
    lastModified: new Date('2024-02-01'),
    dataFormat: 'JSON, CSV, RDF/Turtle',
    categories: ['Sustainability', 'Product Data', 'Environmental Impact'],
    language: 'English',
    metadataLanguage: 'English',
    chargeable: false,
    temporalCoverageStart: new Date('2023-01-01'),
    temporalCoverageEnd: new Date('2024-12-31'),
    geographicCoverage: 'Global',
    updateFrequency: 'Monthly',
    sourceUrl: 'https://example.com/sustainability-data'
  };

  const currentAsset = asset || defaultAsset;

  const mockContactDetails = {
    name: 'Dr. Sarah Johnson',
    organization: 'Sustainable Tech Institute',
    email: 'sarah.johnson@sti.org',
    phone: '+1 (555) 123-4567',
    address: '123 Innovation Drive, Tech City, TC 12345'
  };

  const mockFiles = [
    { name: 'sustainability_metrics_2024.json', size: '2.4 MB', type: 'JSON', lastModified: new Date('2024-02-01') },
    { name: 'carbon_footprint_data.csv', size: '1.8 MB', type: 'CSV', lastModified: new Date('2024-01-28') },
    { name: 'metadata_schema.ttl', size: '156 KB', type: 'RDF', lastModified: new Date('2024-01-15') },
  ];

  const mockPolicies = [
    { name: 'Data Usage Policy', type: 'Usage Rights', status: 'Active' },
    { name: 'Privacy Protection', type: 'Privacy', status: 'Active' },
    { name: 'Attribution Requirements', type: 'Attribution', status: 'Active' },
  ];

  return (
    <Card className="bg-gradient-card shadow-card border border-sidebar-border">
      <CardHeader className="border-b border-sidebar-border">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl text-card-foreground">{currentAsset.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">{currentAsset.description}</p>
          </div>
          <Badge variant="secondary" className="bg-accent/20 text-accent">
            Asset ID: {currentAsset.id}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="core-metadata" className="w-full">
          <div className="border-b border-sidebar-border">
            <TabsList className="grid w-full grid-cols-4 bg-transparent h-12 p-0">
              <TabsTrigger 
                value="core-metadata" 
                className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent rounded-none border-b-2 border-transparent data-[state=active]:border-accent"
              >
                Core Metadata
              </TabsTrigger>
              <TabsTrigger 
                value="contact" 
                className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent rounded-none border-b-2 border-transparent data-[state=active]:border-accent"
              >
                Contact Details
              </TabsTrigger>
              <TabsTrigger 
                value="files" 
                className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent rounded-none border-b-2 border-transparent data-[state=active]:border-accent"
              >
                Files
              </TabsTrigger>
              <TabsTrigger 
                value="policy" 
                className="data-[state=active]:bg-accent/20 data-[state=active]:text-accent rounded-none border-b-2 border-transparent data-[state=active]:border-accent"
              >
                Policy
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="core-metadata" className="p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Asset Dates */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  Asset Timeline
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground">Created Date</span>
                    <span className="text-sm text-card-foreground">{currentAsset.createdDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground">Last Modified</span>
                    <span className="text-sm text-card-foreground">{currentAsset.lastModified.toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Source Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                  <Globe className="w-5 h-5 text-accent" />
                  Source Information
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Original Title</span>
                    </div>
                    <p className="text-sm text-card-foreground">{currentAsset.title}</p>
                  </div>
                  {currentAsset.sourceUrl && (
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Open Data Source</span>
                        <Button variant="ghost" size="sm" className="h-auto p-1 text-accent hover:text-accent">
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-card-foreground truncate">{currentAsset.sourceUrl}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Format & Categories */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent" />
                  Format & Classification
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground block mb-2">Data Format</span>
                    <Badge variant="outline" className="bg-accent/10 text-accent border-accent/30">
                      {currentAsset.dataFormat}
                    </Badge>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground block mb-2">Categories</span>
                    <div className="flex flex-wrap gap-2">
                      {currentAsset.categories.map((category, index) => (
                        <Badge key={index} variant="secondary" className="bg-secondary/20 text-secondary-foreground">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium text-muted-foreground block mb-1">Data Language</span>
                      <span className="text-sm text-card-foreground">{currentAsset.language}</span>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium text-muted-foreground block mb-1">Metadata Language</span>
                      <span className="text-sm text-card-foreground">{currentAsset.metadataLanguage}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chargeable & Coverage */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                  <Tag className="w-5 h-5 text-accent" />
                  Usage & Coverage
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <Label htmlFor="chargeable" className="text-sm font-medium text-muted-foreground">
                      Chargeable Asset
                    </Label>
                    <Switch
                      id="chargeable"
                      checked={isChargeable}
                      onCheckedChange={setIsChargeable}
                    />
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground block mb-2">Temporal Coverage</span>
                    <div className="text-sm text-card-foreground">
                      {currentAsset.temporalCoverageStart?.toLocaleDateString()} - {currentAsset.temporalCoverageEnd?.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium text-muted-foreground block mb-1">Geographic Coverage</span>
                      <span className="text-sm text-card-foreground">{currentAsset.geographicCoverage}</span>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <span className="text-sm font-medium text-muted-foreground block mb-1">Update Frequency</span>
                      <span className="text-sm text-card-foreground">{currentAsset.updateFrequency}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-accent" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="w-5 h-5 text-accent" />
                      <span className="font-medium text-card-foreground">{mockContactDetails.name}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{mockContactDetails.organization}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Mail className="w-4 h-4 text-accent" />
                      <span className="text-sm text-card-foreground">{mockContactDetails.email}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Phone className="w-4 h-4 text-accent" />
                      <span className="text-sm text-card-foreground">{mockContactDetails.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-accent mt-0.5" />
                    <div>
                      <span className="font-medium text-card-foreground block mb-1">Address</span>
                      <p className="text-sm text-muted-foreground">{mockContactDetails.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="files" className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <File className="w-5 h-5 text-accent" />
                Associated Files
              </h3>
              <div className="space-y-3">
                {mockFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <File className="w-5 h-5 text-accent" />
                      <div>
                        <p className="font-medium text-card-foreground">{file.name}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{file.size}</span>
                          <span>{file.type}</span>
                          <span>Modified: {file.lastModified.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-accent hover:text-accent">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="policy" className="p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                Data Policies
              </h3>
              <div className="space-y-3">
                {mockPolicies.map((policy, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-accent" />
                      <div>
                        <p className="font-medium text-card-foreground">{policy.name}</p>
                        <p className="text-sm text-muted-foreground">{policy.type}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={policy.status === 'Active' ? 'default' : 'secondary'}
                      className={policy.status === 'Active' ? 'bg-success text-success-foreground' : ''}
                    >
                      {policy.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}