import React, { useState, useEffect } from 'react';
import { 
  AppState, 
  IndustryType, 
  SocialPlatform, 
  ImageSize, 
  GeneratedImage, 
  BrandIdentity,
  GeneratedVideo,
  LogoStyle
} from './types';
import { 
  optimizePrompt,
  enhanceDescription,
  optimizeVideoPrompt,
  generateBrandText, 
  generateImage, 
  generateVideo,
  exportBrandKitPDF
} from './services/geminiService';
import { Button } from './components/Button';
import { ImageEditor } from './components/ImageEditor';

// Mapping user-friendly styles to technical prompt keywords
const STYLE_DEFINITIONS: Record<LogoStyle, string> = {
  [LogoStyle.MINIMALIST]: 'minimalist, flat vector, swiss design, geometric, sans-serif, high contrast, reductionist, svg style, less is more',
  [LogoStyle.VINTAGE]: 'vintage, retro, badge style, textured, serif typography, 1950s aesthetic, distressed, stamp effect, linocut',
  [LogoStyle.LUXURY]: 'luxury, elegant, sophisticated, serif, thin line weight, monogram, heraldic, high-end fashion, gold foil aesthetic',
  [LogoStyle.ABSTRACT]: 'abstract, conceptual, geometric shapes, fluid forms, modern art, negative space, tech, mathematical',
  [LogoStyle.MASCOT]: 'mascot character, vector illustration, bold outlines, friendly, vibrant, e-sports style, character design',
  [LogoStyle.HAND_DRAWN]: 'hand-drawn, organic, sketch, ink lines, imperfect, artistic, watercolor texture, raw, doodle style',
  [LogoStyle.CYBERPUNK]: 'cyberpunk, neon, futuristic, glitch, high tech, dark background, glowing, sci-fi, matrix',
  [LogoStyle.THREE_D]: '3D render, glossy, volumetric lighting, isometric, depth, plastic material, blender, cinema4d'
};

// Expanded Mockup Presets
const MOCKUP_PRESETS: Record<IndustryType, { id: string; label: string; prompt: string; ratio: string }[]> = {
  [IndustryType.GENERAL]: [
    { id: 'stationery', label: 'Stationery Set', prompt: 'High-end branding stationery set including business cards, letterhead, and envelope arranged on a marble desk, soft natural lighting.', ratio: '3:4' },
    { id: 'signage', label: '3D Glass Sign', prompt: 'Modern 3D glass office signage mounted on a textured concrete wall, cinematic depth of field.', ratio: '16:9' },
    { id: 'merch', label: 'Cotton T-Shirt', prompt: 'Minimalist premium cotton t-shirt mockup on a wooden hanger, studio lighting.', ratio: '3:4' },
    { id: 'idcard', label: 'ID Lanyard', prompt: 'Corporate ID card and lanyard mockup resting on a clean office desk.', ratio: '1:1' },
    { id: 'notebook', label: 'Leather Notebook', prompt: 'Embossed logo on a premium leather notebook, focused close-up shot.', ratio: '3:4' },
    { id: 'wall', label: 'Reception Wall', prompt: 'Large brushed metal logo mounted on a clean white reception wall in a modern office lobby.', ratio: '16:9' }
  ],
  [IndustryType.TECH]: [
    { id: 'laptop', label: 'Laptop Sticker', prompt: 'MacBook Pro on a modern developer desk with the logo applied as a premium vinyl sticker, coding environment background.', ratio: '16:9' },
    { id: 'app', label: 'Mobile App Splash', prompt: 'Modern bezel-less smartphone held in hand displaying the logo on a sleek app splash screen, UI/UX context.', ratio: '9:16' },
    { id: 'hoodie', label: 'Startup Hoodie', prompt: 'Tech developer wearing a black startup hoodie with the logo printed on the chest, modern office background.', ratio: '3:4' },
    { id: 'smartwatch', label: 'Smart Watch', prompt: 'Smart watch displaying the logo on the screen, on a wrist, shallow depth of field.', ratio: '1:1' },
    { id: 'monitor', label: 'Desktop Monitor', prompt: 'Ultrawide desktop monitor displaying the logo on a dark mode dashboard, rgb lighting background.', ratio: '16:9' },
    { id: 'server', label: 'Server Rack', prompt: 'Logo sticker on a high-tech server rack in a datacenter, blue neon lighting.', ratio: '3:4' }
  ],
  [IndustryType.FASHION]: [
    { id: 'tag', label: 'Clothing Tag', prompt: 'Macro shot of a premium clothing hang tag with embossed logo resting on textured fabric.', ratio: '1:1' },
    { id: 'tote', label: 'Canvas Tote', prompt: '[TARGET_AUDIENCE] walking down a city street carrying a canvas tote bag featuring the logo.', ratio: '3:4' },
    { id: 'storefront', label: 'Store Front', prompt: 'Luxury fashion boutique storefront with the logo decal on the glass window, evening lighting.', ratio: '4:3' },
    { id: 'cap', label: 'Embroidered Cap', prompt: 'Baseball cap with 3D embroidered logo sitting on a shelf.', ratio: '1:1' },
    { id: 'shoebox', label: 'Shoe Box', prompt: 'Premium minimalist shoe box packaging design.', ratio: '3:4' },
    { id: 'lookbook', label: 'Lookbook Cover', prompt: 'Fashion lookbook magazine cover featuring the logo overlay.', ratio: '3:4' }
  ],
  [IndustryType.RETAIL]: [
    { id: 'packaging', label: 'Product Packaging', prompt: 'Minimalist sustainable cardboard product packaging box on a podium, studio product photography.', ratio: '1:1' },
    { id: 'bag', label: 'Shopping Bag', prompt: 'Premium paper shopping bag with rope handles held by a customer, blurred retail background.', ratio: '3:4' },
    { id: 'shelf', label: 'Retail Shelf', prompt: 'Products displayed neatly on a wooden retail shelf, soft focus background.', ratio: '16:9' },
    { id: 'van', label: 'Delivery Van', prompt: 'Delivery van with large branding wrap driving on a city street.', ratio: '16:9' },
    { id: 'window', label: 'Window Decal', prompt: 'Vinyl window decal on a shop window, reflection of the street.', ratio: '4:3' },
    { id: 'receipt', label: 'Digital Receipt', prompt: 'Close up of a printed receipt with the logo at the top.', ratio: '3:4' }
  ],
  [IndustryType.HOSPITALITY]: [
    { id: 'menu', label: 'Menu Design', prompt: 'Elegant textured paper menu on a fine dining restaurant table, accompanied by silverware and a wine glass.', ratio: '3:4' },
    { id: 'coaster', label: 'Drink Coaster', prompt: 'Top-down view of a drink coaster under a cocktail glass, bar counter texture.', ratio: '1:1' },
    { id: 'apron', label: 'Staff Apron', prompt: 'Barista or chef wearing a canvas apron with the embroidered logo, busy kitchen depth of field.', ratio: '3:4' },
    { id: 'matchbook', label: 'Matchbook', prompt: 'Vintage style matchbook with logo on a bar counter.', ratio: '16:9' },
    { id: 'napkin', label: 'Cloth Napkin', prompt: 'Embroidered logo on a linen napkin, fine dining setting.', ratio: '1:1' },
    { id: 'neon', label: 'Neon Sign', prompt: 'Bright neon sign of the logo on a brick wall, night ambiance.', ratio: '16:9' }
  ],
  [IndustryType.COFFEE]: [
    { id: 'cup', label: 'Coffee Cup', prompt: 'Paper coffee cup with sleeve held in hand against a blurred city street background, steam rising, warm morning light.', ratio: '3:4' },
    { id: 'beanbag', label: 'Coffee Bag', prompt: 'Kraft paper coffee bean bag packaging standing on a wooden counter next to coffee beans.', ratio: '3:4' },
    { id: 'sign', label: 'Shop Sign', prompt: 'Round wooden hanging shop sign outside a cozy cafe, ivy on brick wall background.', ratio: '1:1' },
    { id: 'mug', label: 'Ceramic Mug', prompt: 'Ceramic mug with logo on a wooden table, cozy atmosphere.', ratio: '1:1' },
    { id: 'machine', label: 'Espresso Machine', prompt: 'Espresso machine with logo decal, barista background.', ratio: '16:9' },
    { id: 'sleeve', label: 'Cup Sleeve', prompt: 'Close up of cardboard cup sleeve with stamped logo.', ratio: '1:1' }
  ]
};

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Helper to run promises in parallel with a concurrency limit
async function runConcurrent<T>(
    tasks: (() => Promise<T>)[],
    concurrency: number,
    onResult: (result: T) => void
): Promise<void> {
   const queue = [...tasks];
   
   const worker = async () => {
     while (queue.length > 0) {
       const task = queue.shift();
       if (task) {
         try {
           const result = await task();
           onResult(result);
         } catch (e) {
           console.error("Task failed", e);
         }
       }
     }
   };
 
   const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
   await Promise.all(workers);
}

// Loading Component
const LoadingOverlay = ({ isVideo = false }: { isVideo?: boolean }) => {
  const [msgIndex, setMsgIndex] = useState(0);
  const generalMessages = [
    "Distilling brand essence...",
    "Harmonizing color palettes...",
    "Drafting geometry...",
    "Rendering lighting effects...",
    "Polishing surfaces...",
    "Finalizing assets..."
  ];
  const videoMessages = [
    "Initializing physics engine...",
    "Computing light rays...",
    "Generating frames...",
    "Synthesizing audio atmosphere...",
    "Stabilizing motion...",
    "Encoding output..."
  ];
  
  const messages = isVideo ? videoMessages : generalMessages;

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isVideo]);

  return (
    <div className="fixed inset-0 z-[60] bg-stone-950/80 backdrop-blur-xl flex flex-col items-center justify-center text-white transition-all duration-500 animate-fade-in">
      <div className="relative mb-8">
         <div className="w-24 h-24 rounded-full border-4 border-stone-800"></div>
         <div className="absolute top-0 left-0 w-24 h-24 rounded-full border-t-4 border-r-4 border-indigo-500 animate-spin"></div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-serif italic text-3xl">V</div>
      </div>
      <h3 className="text-xl font-light tracking-widest uppercase mb-3">{isVideo ? 'Studio Rendering' : 'Constructing Brand'}</h3>
      <p className="text-stone-400 font-serif italic text-xl animate-pulse min-h-[1.75rem]">{messages[msgIndex]}</p>
    </div>
  );
};

export default function App() {
  // State
  const [state, setState] = useState<AppState>(AppState.AGENCY_HUB);
  const [isLoading, setIsLoading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isVideoEnhancing, setIsVideoEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inputs
  const [businessDesc, setBusinessDesc] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>(IndustryType.GENERAL);
  const [selectedLogoStyle, setSelectedLogoStyle] = useState<LogoStyle>(LogoStyle.MINIMALIST);
  const [socialPlatform, setSocialPlatform] = useState<SocialPlatform>(SocialPlatform.INSTAGRAM);
  const [apparelColor, setApparelColor] = useState('#FFFFFF');
  
  // Generation Options
  const [includeBusinessCards, setIncludeBusinessCards] = useState(true);
  const [includeSocialTemplates, setIncludeSocialTemplates] = useState(true);
  const [generationModel, setGenerationModel] = useState('gemini-2.5-flash-image');
  const [generationSize, setGenerationSize] = useState<ImageSize>(ImageSize.SIZE_1K);

  // Intermediate Data
  const [optimizedPrompt, setOptimizedPrompt] = useState('');
  const [logoCandidates, setLogoCandidates] = useState<string[]>([]);
  const [selectedLogoUrl, setSelectedLogoUrl] = useState<string | null>(null);
  const [textIdentity, setTextIdentity] = useState<BrandIdentity | null>(null);
  
  // Final Assets
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedImage[]>([]);
  const [selectedMockupIds, setSelectedMockupIds] = useState<string[]>([]);
  
  // Custom Mockup
  const [showCustomMockupInput, setShowCustomMockupInput] = useState(false);
  const [customMockupPrompt, setCustomMockupPrompt] = useState('');

  // Video State
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [videoResolution, setVideoResolution] = useState<'720p' | '1080p'>('720p');
  const [videoCount, setVideoCount] = useState<number>(1);
  const [videoWithSound, setVideoWithSound] = useState<boolean>(false);
  const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
  
  // Editor State
  const [editingAsset, setEditingAsset] = useState<GeneratedImage | null>(null);

  // --- Handlers ---

  const handleStartProject = () => {
    setState(AppState.INPUT);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        try {
            const base64 = await fileToBase64(e.target.files[0]);
            setSelectedLogoUrl(base64);
            const presets = MOCKUP_PRESETS[selectedIndustry].slice(0, 2).map(m => m.id);
            setSelectedMockupIds(presets);
        } catch (err) {
            console.error("Upload failed", err);
            setError("Failed to upload image. Please try another file.");
        }
    }
  };

  const handleRemoveUploadedLogo = () => {
      setSelectedLogoUrl(null);
  };

  const handleContinueWithUpload = async () => {
     if (!businessDesc || !selectedLogoUrl) return;
     setIsLoading(true);
     setError(null);
     try {
        const optPrompt = await optimizePrompt(businessDesc);
        setOptimizedPrompt(optPrompt);

        const brandId = await generateBrandText(businessDesc);
        setTextIdentity(brandId);
        
        setState(AppState.BRAND_GENERATION);
     } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to generate brand identity');
     } finally {
        setIsLoading(false);
     }
  };

  const handleEnhanceDescription = async () => {
    if (!businessDesc) return;
    setIsEnhancing(true);
    try {
      const refined = await enhanceDescription(businessDesc);
      setBusinessDesc(refined);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleEnhanceVideoPrompt = async () => {
    if (!videoPrompt) return;
    setIsVideoEnhancing(true);
    try {
      const refined = await optimizeVideoPrompt(videoPrompt);
      setVideoPrompt(refined);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsVideoEnhancing(false);
    }
  };

  const handleExportPDF = () => {
    if (textIdentity && generatedAssets.length > 0) {
      exportBrandKitPDF(textIdentity, generatedAssets);
    }
  };

  const handleGenerateLogos = async () => {
    if (!businessDesc) return;
    setIsLoading(true);
    setError(null);
    setLogoCandidates([]);
    setState(AppState.LOGO_SELECTION);

    try {
      const optPrompt = await optimizePrompt(businessDesc, selectedLogoStyle);
      setOptimizedPrompt(optPrompt);

      let brandId = textIdentity;
      if (!brandId) {
          brandId = await generateBrandText(businessDesc);
          setTextIdentity(brandId);
      }
      
      const styleKeywords = STYLE_DEFINITIONS[selectedLogoStyle];
      const commonConstraints = `isolated on a white background, no photorealism, no text clutter, high quality, professional vector art style, centered composition, ${styleKeywords}.`;

      const logoTasks = [
        () => generateImage(
            `Logo Design: ${optPrompt}. Focus on a clear, literal interpretation. ${commonConstraints}`, 
            generationModel, generationSize
        ),
        () => generateImage(
            `Logo Design: ${optPrompt}. Focus on a creative, abstract symbolic interpretation. Unique geometry. ${commonConstraints}`, 
            generationModel, generationSize
        ),
        () => generateImage(
            `Logo Design: ${optPrompt}. Focus on a Monogram or Typography-integrated symbol. Balanced composition. ${commonConstraints}`, 
            generationModel, generationSize
        ),
        () => generateImage(
            `Logo Design: ${optPrompt}. Focus on a self-contained Emblem or Badge layout. Unified structure. ${commonConstraints}`, 
            generationModel, generationSize
        )
      ];

      await runConcurrent(logoTasks, 3, (newLogo) => {
          setLogoCandidates(prev => [...prev, newLogo]);
      });
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate logos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoSelected = (url: string) => {
    setSelectedLogoUrl(url);
    const presets = MOCKUP_PRESETS[selectedIndustry].slice(0, 3).map(m => m.id);
    setSelectedMockupIds(presets);
    setState(AppState.BRAND_GENERATION);
  };

  const toggleMockupSelection = (id: string) => {
    if (selectedMockupIds.includes(id)) {
      setSelectedMockupIds(prev => prev.filter(x => x !== id));
    } else {
      setSelectedMockupIds(prev => [...prev, id]);
    }
  };

  const handleGenerateFinalAssets = async () => {
    if (!selectedLogoUrl || !textIdentity) return;
    setIsLoading(true);
    setError(null);
    setGeneratedAssets([]);
    setState(AppState.DASHBOARD);

    try {
      const targetAudience = textIdentity.targetAudience || 'customers';
      const audienceContext = `Target Audience: ${targetAudience}. Brand Vibe: ${textIdentity.brandVoice || 'Professional'}.`;
      const paletteContext = textIdentity.colorPalette && textIdentity.colorPalette.length > 0 
        ? `Use the brand color palette: ${textIdentity.colorPalette.join(', ')}.` 
        : '';

      const baseMockupPrompt = `A professional product photography shot of a mockup for brand: "${optimizedPrompt || businessDesc}". ${audienceContext} ${paletteContext} The design should be elegant and incorporate the visual style of the logo.`;

      const activeMockups = MOCKUP_PRESETS[selectedIndustry].filter(m => selectedMockupIds.includes(m.id));
      
      const assetTasks: (() => Promise<GeneratedImage>)[] = [];

      if (showCustomMockupInput && customMockupPrompt) {
        assetTasks.push(() => 
            generateImage(
                `${baseMockupPrompt} ${customMockupPrompt}. Professional photography, high detail.`,
                generationModel,
                generationSize,
                selectedLogoUrl,
                "3:4"
            ).then(url => ({
                id: `mockup-custom-${Date.now()}`,
                url,
                prompt: `Custom Session (${customMockupPrompt})`,
                originalPrompt: customMockupPrompt,
                type: 'mockup'
            }))
        );
      }

      activeMockups.forEach((mockup) => {
          let processedPrompt = mockup.prompt;
          if (selectedIndustry === IndustryType.FASHION && processedPrompt.includes('[TARGET_AUDIENCE]')) {
              let modelTerm = 'professional model';
              const aud = targetAudience.toLowerCase();
              if (aud.includes('men') || aud.includes('man') || aud.includes('male')) modelTerm = 'male model';
              if (aud.includes('women') || aud.includes('woman') || aud.includes('female')) modelTerm = 'female model';
              if (aud.includes('kid') || aud.includes('child')) modelTerm = 'child model';
              
              processedPrompt = processedPrompt.replace('[TARGET_AUDIENCE]', modelTerm);
          }

          const apparelIds = ['merch', 'hoodie', 'apron', 'tote', 't-shirt', 'cap'];
          if (apparelIds.some(id => mockup.id.includes(id))) {
              processedPrompt = processedPrompt + ` The apparel item should be ${apparelColor} color.`;
          }

          assetTasks.push(() => 
              generateImage(
                  `${baseMockupPrompt} ${processedPrompt} Style: Clean, minimalist, studio lighting.`, 
                  generationModel, 
                  generationSize, 
                  selectedLogoUrl,
                  mockup.ratio
              ).then(url => ({
                  id: `mockup-${mockup.id}-v1`,
                  url,
                  prompt: `${mockup.label} (Studio)`,
                  originalPrompt: processedPrompt,
                  type: 'mockup'
              }))
          );
      });

      if (includeBusinessCards) {
          const cardPrompts = [
             { label: 'Business Card (Flat Lay)', prompt: 'Minimalist business card design arranged on a clean, textured surface. Top down view. Clear logo placement.', ratio: '3:4' },
             { label: 'Business Card (Stack)', prompt: 'Artistic stack of premium business cards showing the side edges and brand color. Depth of field.', ratio: '1:1' },
             { label: 'Business Card (Hand)', prompt: 'A hand holding the business card against a blurred modern office background. Realistic context.', ratio: '3:4' }
          ];

          cardPrompts.forEach((card) => {
             assetTasks.push(() => 
                generateImage(
                    `${baseMockupPrompt} ${card.prompt}. Professional print design.`,
                    generationModel,
                    generationSize,
                    selectedLogoUrl,
                    card.ratio
                ).then(url => ({
                    id: `biz-card-${Date.now()}-${Math.random()}`,
                    url,
                    prompt: card.label,
                    originalPrompt: card.prompt,
                    type: 'business_card'
                }))
             );
          });
      }

      if (includeSocialTemplates) {
          const socialTemplates = [
             { platform: 'Instagram', label: 'Instagram Template', prompt: 'A clean, aesthetic Instagram post template background. Square format. Uses brand colors and logo watermark. Minimalist design for quotes or announcements.', ratio: '1:1' },
             { platform: 'Twitter', label: 'Twitter Header', prompt: 'A bold, professional Twitter X header banner design. Landscape 16:9. Tech-forward, geometric patterns using brand colors. Space for text.', ratio: '16:9' },
             { platform: 'LinkedIn', label: 'LinkedIn Post', prompt: 'A corporate, trustworthy LinkedIn post slide background. Professional presentation style. Subtle branding.', ratio: '3:4' }
          ];

          socialTemplates.forEach((tmpl) => {
              assetTasks.push(() => 
                 generateImage(
                    `${baseMockupPrompt} ${tmpl.prompt}`,
                    generationModel,
                    generationSize,
                    selectedLogoUrl,
                    tmpl.ratio
                 ).then(url => ({
                    id: `social-tmpl-${Date.now()}-${Math.random()}`,
                    url,
                    prompt: tmpl.label,
                    originalPrompt: tmpl.prompt,
                    type: 'social_template'
                 }))
              );
          });
      }
      
      let socialPrompt = "";
      let socialRatio = "1:1";
      switch (socialPlatform) {
        case SocialPlatform.INSTAGRAM: socialPrompt = `A photorealistic lifestyle photography shot for an Instagram post for the brand ${businessDesc}. ${paletteContext} The image features visual storytelling appealing to ${targetAudience}. Cinematic lighting, high resolution, no text overlay.`; socialRatio = "3:4"; break;
        case SocialPlatform.TWITTER: socialPrompt = `A modern, punchy digital artwork or photography for a Twitter (X) post for ${businessDesc}. ${paletteContext} High impact, minimalist style, suitable for a tech-savvy audience.`; socialRatio = "16:9"; break;
        case SocialPlatform.FACEBOOK: socialPrompt = `A warm, inviting, community-focused photograph for a Facebook post for ${businessDesc}. ${paletteContext} Authentic, relatable style with natural lighting.`; socialRatio = "16:9"; break;
        case SocialPlatform.LINKEDIN: socialPrompt = `A professional, sleek corporate photography shot for a LinkedIn update for ${businessDesc}. ${paletteContext} Business-oriented, clean aesthetic, office environment context.`; socialRatio = "16:9"; break;
        case SocialPlatform.STORY: socialPrompt = `A vertical, dynamic, eye-catching photography shot for an Instagram Story for ${businessDesc}. ${paletteContext} Immersive, high energy, vibrant colors.`; socialRatio = "9:16"; break;
        default: socialPrompt = `A viral, high-quality social media photography image for ${businessDesc}. ${paletteContext}`; socialRatio = "1:1";
      }

      const socialLogoPrompt = `A digital design of a Social Media Profile Picture version of the logo for ${optimizedPrompt || businessDesc}. ${paletteContext} Center icon, solid background, high contrast vector style.`;
      const webLogoPrompt = `A digital design of a Website Header version of the logo for ${optimizedPrompt || businessDesc}. ${paletteContext} Horizontal layout, clean typography, transparent background style.`;
      const iconLogoPrompt = `A digital design of an App Icon version of the logo for ${optimizedPrompt || businessDesc}. ${paletteContext} Isolated symbol, high contrast, square format, app store style.`;

      assetTasks.push(() => generateImage(socialPrompt, generationModel, generationSize, undefined, socialRatio).then(url => ({ id: 'post-1', url, prompt: `${socialPlatform} Post (Campaign)`, originalPrompt: socialPrompt, type: 'social_post' })));
      assetTasks.push(() => generateImage(socialLogoPrompt, generationModel, generationSize, selectedLogoUrl, "1:1").then(url => ({ id: 'social-logo', url, prompt: 'Social Media Profile Logo', originalPrompt: socialLogoPrompt, type: 'logo' })));
      assetTasks.push(() => generateImage(webLogoPrompt, generationModel, generationSize, selectedLogoUrl, "16:9").then(url => ({ id: 'web-logo', url, prompt: 'Website Header Logo', originalPrompt: webLogoPrompt, type: 'logo' })));
      assetTasks.push(() => generateImage(iconLogoPrompt, generationModel, generationSize, selectedLogoUrl, "1:1").then(url => ({ id: 'app-icon', url, prompt: 'App Icon', originalPrompt: iconLogoPrompt, type: 'logo' })));

      await runConcurrent(assetTasks, 3, (newAsset) => {
          setGeneratedAssets(prev => [...prev, newAsset]);
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate assets");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt) return;
    setIsLoading(true);
    setError(null);
    try {
      const videoTasks = [];
      for(let i = 0; i < videoCount; i++) {
        videoTasks.push(() => generateVideo(videoPrompt, selectedLogoUrl, videoAspectRatio, videoWithSound, videoResolution));
      }

      await runConcurrent(videoTasks, 1, (newUrl) => {
         const newVideo = {
             id: `vid-${Date.now()}-${Math.random()}`,
             url: newUrl,
             prompt: videoPrompt,
             hasSound: videoWithSound
         };
         setGeneratedVideos(prev => [newVideo, ...prev]);
      });

    } catch (err: any) {
      console.error("Video Generation Error:", err);
      setError(err.message || "Failed to generate video");
    } finally {
      setIsLoading(false);
    }
  };

  if (editingAsset) {
    return (
      <ImageEditor 
        initialImage={editingAsset.url}
        assetType={editingAsset.type}
        overlayImage={selectedLogoUrl || undefined}
        onClose={() => setEditingAsset(null)}
        onSave={(newImg) => {
           setGeneratedAssets(prev => prev.map(a => 
             a.id === editingAsset.id ? { ...a, url: newImg } : a
           ));
           setEditingAsset(null);
        }}
      />
    );
  }

  const renderContent = () => {
    switch(state) {
      case AppState.AGENCY_HUB:
        return (
          <div className="min-h-screen bg-[#FDFBF7] text-stone-900 overflow-x-hidden">
             {isLoading && <LoadingOverlay />}
             <nav className="flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto">
                <div className="font-serif text-2xl font-bold tracking-tight text-stone-900">VeloBrand.</div>
                <div className="flex items-center gap-4">
                  <div className="hidden md:block text-xs font-semibold tracking-wide uppercase text-stone-400">v1.1.0</div>
                  <Button size="sm" variant="outline" onClick={() => window.open('https://github.com/google-gemini/cookbook', '_blank')}>Documentation</Button>
                </div>
             </nav>

             <main className="max-w-7xl mx-auto px-6 md:px-12 pt-8 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8 animate-fade-in">
                   <div className="inline-block px-3 py-1 bg-stone-100 border border-stone-200 rounded-full text-xs font-semibold tracking-wide uppercase text-stone-600">
                      AI Creative Director
                   </div>
                   <h1 className="text-6xl md:text-7xl lg:text-8xl font-serif font-medium leading-[1.05] tracking-tight">
                      Design your <br/>
                      <span className="italic text-stone-400 font-light">brand legacy</span> <br/>
                      in seconds.
                   </h1>
                   <p className="text-lg md:text-xl text-stone-600 max-w-md leading-relaxed font-light">
                      From logo concepts to full marketing kits and motion graphics. 
                      Your personal AI design studio is ready.
                   </p>
                   <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <Button size="lg" className="rounded-full px-10" onClick={handleStartProject}>Start New Project</Button>
                      <Button size="lg" variant="ghost" className="rounded-full" onClick={() => {}}>How it works</Button>
                   </div>
                   
                   <div className="pt-12 grid grid-cols-3 gap-8 border-t border-stone-200/60">
                      <div>
                         <div className="text-3xl font-serif text-stone-300">01</div>
                         <div className="text-sm font-bold mt-2 uppercase tracking-wide">Brief</div>
                      </div>
                      <div>
                         <div className="text-3xl font-serif text-stone-300">02</div>
                         <div className="text-sm font-bold mt-2 uppercase tracking-wide">Curate</div>
                      </div>
                      <div>
                         <div className="text-3xl font-serif text-stone-300">03</div>
                         <div className="text-sm font-bold mt-2 uppercase tracking-wide">Launch</div>
                      </div>
                   </div>
                </div>

                <div className="relative h-[600px] w-full hidden lg:block">
                   <div className="absolute top-0 right-0 w-4/5 h-4/5 bg-stone-200 rounded-tl-[120px] rounded-br-[40px] overflow-hidden shadow-inner">
                      <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop" className="w-full h-full object-cover opacity-60 mix-blend-multiply" alt="Mood" />
                   </div>
                   
                   <div className="absolute bottom-20 left-10 w-2/3 bg-white p-8 shadow-2xl rounded-tr-[40px] rounded-bl-[40px] flex flex-col justify-between border border-stone-100 backdrop-blur-sm bg-white/90">
                       <div className="flex justify-between items-start mb-8">
                          <div className="w-12 h-12 bg-stone-900 rounded-full flex items-center justify-center text-white font-serif italic text-xl">V</div>
                          <div className="space-y-2">
                             <div className="w-24 h-1.5 bg-stone-200 rounded-full"></div>
                             <div className="w-16 h-1.5 bg-stone-200 rounded-full ml-auto"></div>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <div className="flex gap-2">
                             <div className="h-16 w-1/3 bg-[#D4C4B7] rounded-lg"></div>
                             <div className="h-16 w-1/3 bg-[#8B7E74] rounded-lg"></div>
                             <div className="h-16 w-1/3 bg-[#4A403A] rounded-lg"></div>
                          </div>
                          <div className="flex gap-2 items-center pt-2">
                             <div className="h-1.5 w-full bg-stone-100 rounded-full"></div>
                             <div className="h-1.5 w-1/2 bg-stone-100 rounded-full"></div>
                          </div>
                       </div>
                   </div>

                   <div className="absolute top-10 left-20 w-16 h-16 border-4 border-stone-900 rounded-full opacity-10"></div>
                </div>
             </main>
          </div>
        );

      case AppState.INPUT:
        return (
          <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
            {isLoading && <LoadingOverlay />}
            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <div className="lg:col-span-8 bg-white rounded-3xl shadow-xl border border-stone-100 overflow-hidden flex flex-col">
                    <div className="p-8 md:p-12 flex-1">
                        <div className="mb-8">
                            <button onClick={() => setState(AppState.AGENCY_HUB)} className="text-stone-400 hover:text-stone-900 text-sm font-medium mb-4 flex items-center gap-2 transition-colors">
                            ← Back to Hub
                            </button>
                            <h2 className="text-4xl font-serif font-medium mb-3 text-stone-900">Create Project Brief</h2>
                            <p className="text-stone-500 font-light text-lg">Tell us about the brand you want to build.</p>
                        </div>
                        
                        <div className="space-y-10">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">
                                  <span className="w-2 h-2 bg-stone-300 rounded-full"></span>
                                  Select Industry
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.values(IndustryType).map((ind) => (
                                    <button
                                        key={ind}
                                        onClick={() => setSelectedIndustry(ind)}
                                        className={`p-5 rounded-2xl text-left transition-all duration-300 group border relative overflow-hidden ${
                                        selectedIndustry === ind 
                                        ? 'border-stone-900 bg-stone-900 text-white shadow-xl scale-[1.02]' 
                                        : 'border-stone-100 bg-stone-50 hover:border-stone-300 hover:bg-white hover:shadow-md'
                                        }`}
                                    >
                                        <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${selectedIndustry === ind ? 'text-white' : 'text-stone-900'}`}>
                                           <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z"/></svg>
                                        </div>
                                        <span className={`block text-[10px] font-bold uppercase tracking-wider mb-2 opacity-60 ${selectedIndustry === ind ? 'text-stone-300' : 'text-stone-400'}`}>Industry</span>
                                        <span className="font-serif font-medium text-lg block leading-tight">{ind.split(' / ')[0]}</span>
                                    </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest mb-4">
                                  <span className="w-2 h-2 bg-stone-300 rounded-full"></span>
                                  Visual Style
                                </label>
                                <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-thin">
                                   {Object.values(LogoStyle).map(style => (
                                      <button 
                                        key={style}
                                        onClick={() => setSelectedLogoStyle(style)}
                                        className={`px-4 py-3 rounded-xl border whitespace-nowrap text-sm font-medium transition-all ${
                                            selectedLogoStyle === style 
                                            ? 'bg-stone-900 text-white border-stone-900 shadow-md' 
                                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                                        }`}
                                      >
                                        {style}
                                      </button>
                                   ))}
                                </div>
                            </div>

                            <div>
                            <div className="flex justify-between items-end mb-4">
                                <label className="flex items-center gap-2 text-xs font-bold text-stone-400 uppercase tracking-widest">
                                  <span className="w-2 h-2 bg-stone-300 rounded-full"></span>
                                  Business Description
                                </label>
                                <button 
                                    onClick={handleEnhanceDescription}
                                    disabled={!businessDesc || isEnhancing}
                                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-full border border-indigo-100"
                                >
                                    {isEnhancing ? (
                                    <>
                                        <svg className="animate-spin w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Refining...
                                    </>
                                    ) : (
                                    <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        AI Enhance
                                    </>
                                    )}
                                </button>
                            </div>
                            <textarea
                                className="w-full p-6 bg-stone-50 border border-stone-200 rounded-2xl h-48 focus:ring-2 focus:ring-stone-900 focus:outline-none transition-all resize-none text-stone-800 placeholder-stone-400 text-lg leading-relaxed font-light"
                                placeholder="e.g. A sustainable coffee roastery in Portland called 'Moss & Mist' that focuses on fair trade beans and a cozy, rainy-day atmosphere..."
                                value={businessDesc}
                                onChange={(e) => setBusinessDesc(e.target.value)}
                            />
                            </div>
                            
                            {error && <div className="text-red-500 text-sm p-4 bg-red-50 rounded-xl border border-red-100 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {error}
                            </div>}
                            
                            <div className="flex justify-end pt-4">
                                <Button className="w-full md:w-auto px-12" size="lg" disabled={!businessDesc || isLoading} onClick={handleGenerateLogos} isLoading={isLoading}>
                                    Generate Concepts →
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8">
                        <h3 className="font-serif text-xl font-medium mb-6 flex items-center gap-2">
                            <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            Render Engine
                        </h3>
                        <div className="space-y-3">
                            <button 
                                onClick={() => setGenerationModel('gemini-2.5-flash-image')}
                                className={`w-full p-4 rounded-xl border text-left transition-all ${generationModel === 'gemini-2.5-flash-image' ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900' : 'border-stone-200 hover:border-stone-400'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm text-stone-900">Flash (Fast)</span>
                                    {generationModel === 'gemini-2.5-flash-image' && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                                </div>
                                <div className="text-xs text-stone-500">Gemini 2.5 Flash Image. Optimized for speed and efficiency.</div>
                            </button>

                            <button 
                                onClick={() => setGenerationModel('gemini-3-pro-image-preview')}
                                className={`w-full p-4 rounded-xl border text-left transition-all ${generationModel === 'gemini-3-pro-image-preview' ? 'border-stone-900 bg-stone-50 ring-1 ring-stone-900' : 'border-stone-200 hover:border-stone-400'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-bold text-sm text-stone-900">Pro (High Quality)</span>
                                    {generationModel === 'gemini-3-pro-image-preview' && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                                </div>
                                <div className="text-xs text-stone-500">Gemini 3 Pro Image. Maximum detail and creative adherence.</div>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8 flex flex-col justify-center">
                        <h3 className="font-serif text-xl font-medium mb-4 flex items-center gap-2">
                             <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                             Existing Assets
                        </h3>
                        <p className="text-sm text-stone-500 mb-6">Skip logo generation? Upload your own mark.</p>
                        
                        {!selectedLogoUrl ? (
                             <div className="border-2 border-dashed border-stone-200 rounded-xl p-8 text-center hover:bg-stone-50 transition-colors cursor-pointer relative flex flex-col items-center justify-center flex-1 min-h-[150px] group">
                                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileUpload} />
                                <div className="w-12 h-12 bg-stone-100 group-hover:bg-white rounded-full flex items-center justify-center text-stone-400 mb-3 transition-colors shadow-sm">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                </div>
                                <p className="text-sm font-bold text-stone-600">Upload Logo</p>
                                <p className="text-[10px] text-stone-400 mt-1 uppercase tracking-wide">PNG or JPG</p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col">
                                <div className="relative rounded-xl border border-stone-200 p-4 bg-stone-50 flex items-center justify-center mb-4 flex-1">
                                    <img src={selectedLogoUrl} className="max-w-full max-h-48 object-contain" alt="Uploaded Logo" />
                                    <button onClick={handleRemoveUploadedLogo} className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm hover:bg-red-50 text-stone-400 hover:text-red-500">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                </div>
                                <Button variant="secondary" onClick={handleContinueWithUpload} disabled={!businessDesc || isLoading} isLoading={isLoading}>
                                    Use This Logo →
                                </Button>
                                {!businessDesc && <p className="text-xs text-red-400 mt-2 text-center">Please enter a business description first.</p>}
                            </div>
                        )}
                    </div>

                </div>
            </div>
          </div>
        );

      case AppState.LOGO_SELECTION:
        return (
          <div className="min-h-screen bg-[#FDFBF7] flex flex-col">
             {isLoading && <LoadingOverlay />}
             <div className="max-w-7xl mx-auto w-full px-6 py-12 flex-1 flex flex-col">
                <div className="flex justify-between items-end mb-12 max-w-6xl mx-auto w-full">
                    <div className="max-w-2xl">
                        <button onClick={() => setState(AppState.INPUT)} className="text-stone-400 hover:text-stone-900 text-sm font-medium mb-4 flex items-center gap-2 transition-colors">
                            ← Back to Brief
                        </button>
                        <h2 className="text-3xl font-serif font-medium mb-3">Brand Direction</h2>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 bg-stone-100 text-stone-600 rounded">{selectedLogoStyle}</span>
                        </div>
                        <p className="text-stone-500">We've generated 4 high-fidelity concepts based on your brief.<br/>Select the one that resonates most with your vision.</p>
                    </div>
                    <Button variant="outline" onClick={handleGenerateLogos} disabled={isLoading} size="sm">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Regenerate Concepts
                    </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto w-full">
                   {[...Array(4)].map((_, i) => {
                      const url = logoCandidates[i];
                      return (
                          <div key={i} className={`group relative aspect-square bg-white border border-stone-200 rounded-2xl overflow-hidden ${url ? 'cursor-pointer hover:shadow-2xl hover:-translate-y-1' : 'opacity-70'} transition-all duration-300`}>
                            {url ? (
                                <>
                                    <div onClick={() => handleLogoSelected(url)} className="w-full h-full p-8 flex items-center justify-center animate-fade-in">
                                        <img src={url} alt={`Logo option ${i}`} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end h-1/2 pointer-events-none">
                                        <span className="bg-white text-stone-900 px-4 py-2 rounded-full text-xs font-bold shadow-lg pointer-events-auto cursor-pointer" onClick={() => handleLogoSelected(url)}>Select</span>
                                        <a href={url} download={`logo-concept-${i+1}.png`} onClick={(e) => e.stopPropagation()} className="bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-stone-900 p-2 rounded-full transition-colors pointer-events-auto" title="Download Concept">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                        </a>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="flex flex-col items-center">
                                        <svg className="animate-spin h-8 w-8 text-stone-300 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span className="text-xs font-medium text-stone-400 animate-pulse">Generating...</span>
                                    </div>
                                </div>
                            )}
                          </div>
                      );
                   })}
                </div>
             </div>
          </div>
        );

      case AppState.BRAND_GENERATION:
        return (
           <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
              {isLoading && <LoadingOverlay />}
              <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-3 gap-6">
                 
                 <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-stone-100 p-8 md:p-12">
                    <div className="mb-8">
                        <h2 className="text-2xl font-serif font-medium mb-2">Configure Asset Package</h2>
                        <p className="text-stone-500 text-sm">Select the deliverables you need for launch.</p>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                             <h3 className="font-bold text-sm uppercase tracking-wide text-stone-400 mb-4">Essentials</h3>
                             <div className="space-y-3">
                                 <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-stone-200 cursor-pointer hover:border-stone-400 transition-colors">
                                     <input 
                                         type="checkbox" 
                                         checked={includeBusinessCards} 
                                         onChange={(e) => setIncludeBusinessCards(e.target.checked)}
                                         className="mt-1 w-4 h-4 accent-stone-900"
                                     />
                                     <div>
                                         <p className="font-bold text-sm text-stone-800">Business Card Set</p>
                                         <p className="text-xs text-stone-500 mt-0.5">3 Variations: Flat Lay, Stack, Hand-held</p>
                                     </div>
                                 </label>

                                 <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-stone-200 cursor-pointer hover:border-stone-400 transition-colors">
                                     <input 
                                         type="checkbox" 
                                         checked={includeSocialTemplates} 
                                         onChange={(e) => setIncludeSocialTemplates(e.target.checked)}
                                         className="mt-1 w-4 h-4 accent-stone-900"
                                     />
                                     <div>
                                         <p className="font-bold text-sm text-stone-800">Social Media Templates</p>
                                         <p className="text-xs text-stone-500 mt-0.5">Templates for Instagram (Square), Twitter (Header), LinkedIn (Post)</p>
                                     </div>
                                 </label>
                             </div>
                        </div>

                        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-sm uppercase tracking-wide text-stone-400">Required Mockups</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-stone-400 uppercase">Apparel Color</span>
                                <input 
                                    type="color" 
                                    value={apparelColor}
                                    onChange={(e) => setApparelColor(e.target.value)}
                                    className="w-6 h-6 rounded-full overflow-hidden border border-stone-300 cursor-pointer"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            {MOCKUP_PRESETS[selectedIndustry].map((m) => (
                                <label key={m.id} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-stone-200 cursor-pointer hover:border-stone-400 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={selectedMockupIds.includes(m.id)} 
                                    onChange={() => toggleMockupSelection(m.id)}
                                    className="mt-1 w-4 h-4 accent-stone-900"
                                />
                                <div>
                                    <p className="font-bold text-sm text-stone-800">{m.label}</p>
                                    <p className="text-xs text-stone-500 mt-0.5">{m.prompt}</p>
                                </div>
                                </label>
                            ))}
                            
                            <div className="pt-2 mt-2">
                                <label className="flex items-center gap-2 text-sm font-medium mb-2 cursor-pointer text-stone-600">
                                    <input 
                                        type="checkbox" 
                                        checked={showCustomMockupInput} 
                                        onChange={(e) => setShowCustomMockupInput(e.target.checked)}
                                        className="w-4 h-4 accent-stone-900"
                                    />
                                    Add Custom Mockup Request
                                </label>
                                {showCustomMockupInput && (
                                    <input 
                                        type="text" 
                                        value={customMockupPrompt}
                                        onChange={(e) => setCustomMockupPrompt(e.target.value)}
                                        placeholder="E.g., A billboard in Times Square..."
                                        className="w-full p-3 border border-stone-200 rounded-xl text-sm focus:ring-1 focus:ring-stone-900 outline-none"
                                    />
                                )}
                            </div>
                        </div>
                        </div>

                        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100">
                        <h3 className="font-bold text-sm uppercase tracking-wide text-stone-400 mb-4">Social Media Focus</h3>
                        <div className="flex flex-wrap gap-2">
                            {Object.values(SocialPlatform).map((p) => (
                                <button
                                key={p}
                                onClick={() => setSocialPlatform(p)}
                                className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${socialPlatform === p ? 'bg-stone-900 text-white border-stone-900 shadow-md' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-400'}`}
                                >
                                {p}
                                </button>
                            ))}
                        </div>
                        </div>

                        {error && <div className="text-red-500 text-sm p-3 bg-red-50 rounded-lg border border-red-100">{error}</div>}

                        <Button className="w-full" size="lg" onClick={handleGenerateFinalAssets} isLoading={isLoading}>
                        Generate Full Brand Kit
                        </Button>
                    </div>
                 </div>

                 <div className="bg-white rounded-3xl shadow-xl border border-stone-100 p-8 flex flex-col">
                    <h3 className="font-serif text-lg font-medium mb-4">My Logo</h3>
                    <div className="bg-stone-50 rounded-xl border border-stone-200 p-6 flex items-center justify-center flex-1 min-h-[200px]">
                        {selectedLogoUrl ? (
                            <img src={selectedLogoUrl} className="max-w-full max-h-64 object-contain shadow-sm" alt="Selected Anchor Logo" />
                        ) : (
                            <div className="text-stone-400 text-sm">No logo selected</div>
                        )}
                    </div>
                    <p className="text-xs text-stone-500 mt-4 text-center">This logo will be used as the visual anchor for all generated mockups and assets.</p>
                 </div>
              </div>
           </div>
        );

      case AppState.DASHBOARD:
        return (
          <div className="flex h-screen overflow-hidden bg-[#FDFBF7]">
             <div className="w-72 bg-stone-900 text-stone-300 flex flex-col p-6 shadow-2xl z-10">
                <div className="mb-10">
                   <h2 className="font-serif text-2xl font-bold text-white tracking-tight">VeloBrand.</h2>
                   <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-stone-500">Project Active</p>
                   </div>
                </div>
                
                <nav className="space-y-2 flex-1">
                   <button onClick={() => setState(AppState.DASHBOARD)} className="w-full text-left px-4 py-3 bg-stone-800 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-3">
                      <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                      Brand Assets
                   </button>
                   <button onClick={() => setState(AppState.VIDEO_STUDIO)} className="w-full text-left px-4 py-3 hover:bg-stone-800 rounded-lg text-sm font-medium transition-colors flex items-center gap-3">
                      <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                      Video Studio
                   </button>
                </nav>

                <div className="pt-6 border-t border-stone-800">
                   <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3">Current Brief</p>
                   <div className="p-3 bg-stone-800 rounded-lg">
                      <p className="text-xs leading-relaxed text-stone-400 line-clamp-3">{businessDesc}</p>
                   </div>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-8 lg:p-12">
                <header className="flex justify-between items-center mb-10">
                   <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-serif font-bold text-stone-900">Brand Kit</h1>
                        <span className={`px-3 py-1 bg-stone-100 text-stone-500 rounded-full text-xs font-bold border border-stone-200`}>
                            {generationModel === 'gemini-2.5-flash-image' ? 'Generated by Flash 2.5' : 'Generated by Pro 3'}
                        </span>
                   </div>
                   <div className="flex gap-3">
                      <Button variant="outline" size="sm" onClick={handleExportPDF}>Export PDF</Button>
                      <Button size="sm">Share Link</Button>
                   </div>
                </header>

                {textIdentity && (
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                      <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm col-span-2">
                         <div className="flex items-center gap-2 mb-6">
                            <div className="w-2 h-2 bg-stone-900 rounded-full"></div>
                            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Brand Strategy</h3>
                         </div>
                         <div className="space-y-8">
                            <div>
                               <p className="text-sm font-bold text-stone-400 uppercase mb-2">Tagline</p>
                               <p className="text-2xl font-serif italic text-stone-800 leading-snug">"{textIdentity.tagline}"</p>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                               <div>
                                  <p className="text-sm font-bold text-stone-400 uppercase mb-2">Brand Voice</p>
                                  <p className="text-sm text-stone-700 font-medium leading-relaxed">{textIdentity.brandVoice}</p>
                                </div>
                               <div>
                                  <p className="text-sm font-bold text-stone-400 uppercase mb-2">Target Audience</p>
                                  <p className="text-sm text-stone-700 font-medium leading-relaxed">{textIdentity.targetAudience}</p>
                               </div>
                            </div>
                         </div>
                      </div>
                      <div className="bg-white p-8 rounded-2xl border border-stone-200 shadow-sm">
                         <div className="flex items-center gap-2 mb-6">
                             <div className="w-2 h-2 bg-stone-900 rounded-full"></div>
                             <h3 className="text-xs font-bold text-stone-400 uppercase tracking-widest">Visual Identity</h3>
                         </div>
                         <div className="space-y-8">
                            <div>
                               <p className="text-sm font-bold text-stone-400 uppercase mb-3">Palette</p>
                               <div className="flex flex-wrap gap-3">
                                  {textIdentity.colorPalette.map((color, i) => (
                                     <div key={i} className="group relative">
                                        <div className="w-10 h-10 rounded-full border border-stone-100 shadow-sm cursor-pointer hover:scale-110 transition-transform" style={{ backgroundColor: color }}></div>
                                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">{color}</span>
                                     </div>
                                  ))}
                               </div>
                            </div>
                            <div>
                               <p className="text-sm font-bold text-stone-400 uppercase mb-3">Typography</p>
                               <div className="space-y-2">
                                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                                     <p className="text-xs text-stone-400 mb-1">Headings</p>
                                     <p className="text-sm font-bold text-stone-800">{textIdentity.typography.heading}</p>
                                  </div>
                                  <div className="p-3 bg-stone-50 rounded-lg border border-stone-100">
                                     <p className="text-xs text-stone-400 mb-1">Body</p>
                                     <p className="text-sm font-medium text-stone-800">{textIdentity.typography.body}</p>
                                  </div>
                               </div>
                            </div>
                         </div>
                      </div>
                   </div>
                )}

                <h3 className="text-xl font-serif font-bold mb-6 text-stone-900">Visual Assets</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                   {generatedAssets.length === 0 && isLoading ? (
                       [...Array(6)].map((_, i) => (
                         <div key={i} className="aspect-square bg-stone-100 rounded-2xl animate-pulse border border-stone-200 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full border-2 border-stone-200 border-t-stone-400 animate-spin"></div>
                         </div>
                       ))
                   ) : (
                      generatedAssets.map((asset) => (
                          <div key={asset.id} className="group bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 animate-fade-in">
                            <div className="aspect-square relative overflow-hidden bg-stone-100">
                                <img src={asset.url} alt={asset.prompt} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 transition-opacity opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3">
                                  <Button size="sm" className="bg-white text-stone-900 hover:bg-stone-100 border-none" onClick={() => setEditingAsset(asset)}>
                                      {asset.type === 'social_template' ? 'Customize Template' : 'Open Editor'}
                                  </Button>
                                  <a href={asset.url} download={`asset-${asset.id}.png`} className="text-white text-xs font-medium hover:underline flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                      Download PNG
                                  </a>
                                </div>
                            </div>
                            <div className="p-4">
                                <p className="font-bold text-sm truncate text-stone-800">{asset.prompt}</p>
                                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1 block">{asset.type.replace('_', ' ')}</span>
                            </div>
                          </div>
                      ))
                   )}
                   
                   {isLoading && generatedAssets.length > 0 && (
                      <div className="aspect-square bg-stone-50 rounded-2xl border border-stone-100 border-dashed flex flex-col items-center justify-center animate-pulse">
                          <span className="text-xs font-medium text-stone-400">Processing...</span>
                      </div>
                   )}
                </div>
             </div>
          </div>
        );

      case AppState.VIDEO_STUDIO:
        return (
          <div className="flex h-screen bg-stone-950 text-stone-300 overflow-hidden font-sans">
             {isLoading && generatedVideos.length === 0 && <LoadingOverlay isVideo={true} />}

             <div className="w-96 flex flex-col border-r border-stone-800 bg-stone-900/50 backdrop-blur-sm z-20">
                <div className="p-6 border-b border-stone-800">
                   <button onClick={() => setState(AppState.DASHBOARD)} className="flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-white transition-colors mb-6 uppercase tracking-widest">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                      Exit Studio
                   </button>
                   <h2 className="font-serif text-3xl font-bold text-white">Motion Lab</h2>
                   <p className="text-stone-500 text-sm mt-1">Generate cinematic assets with Veo.</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                   <div className="space-y-3">
                      <div className="flex justify-between items-center">
                          <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Input Asset</label>
                          {selectedLogoUrl && (
                              <button onClick={() => setSelectedLogoUrl(null)} className="text-[10px] text-red-400 hover:text-red-300">Clear</button>
                          )}
                      </div>
                      <div className="p-4 bg-stone-900 rounded-xl border border-stone-800 flex items-center gap-4 group hover:border-stone-700 transition-colors">
                         <div className="w-12 h-12 bg-black rounded-lg p-2 border border-stone-800 flex items-center justify-center">
                            {selectedLogoUrl ? <img src={selectedLogoUrl} className="max-w-full max-h-full" alt="Ref" /> : <div className="w-2 h-2 bg-stone-700 rounded-full"></div>}
                         </div>
                         <div>
                            <p className="text-xs font-bold text-white">{selectedLogoUrl ? 'Brand Logo' : 'No Asset'}</p>
                            <p className="text-[10px] text-stone-500">{selectedLogoUrl ? 'Reference anchor' : 'Text-to-Video Mode'}</p>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3">
                     <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Direction</label>
                        <button 
                           onClick={handleEnhanceVideoPrompt}
                           disabled={!videoPrompt || isVideoEnhancing}
                           className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                        >
                           {isVideoEnhancing ? (
                               <span className="animate-pulse">Optimizing...</span>
                           ) : (
                               <>
                                   <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                   AI Enhance
                               </>
                           )}
                        </button>
                     </div>
                     <textarea 
                       className="w-full p-4 bg-black/40 border border-stone-800 rounded-xl text-sm h-32 resize-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none text-stone-200 placeholder-stone-700 transition-all"
                       placeholder="Describe the scene motion, lighting, and camera movement..."
                       value={videoPrompt}
                       onChange={(e) => setVideoPrompt(e.target.value)}
                     />
                   </div>

                   <div className="space-y-3">
                       <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Video Settings</label>
                       
                       <div className="grid grid-cols-2 gap-3 mb-3">
                           <button onClick={() => setVideoAspectRatio('16:9')} className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left flex items-center justify-between ${videoAspectRatio === '16:9' ? 'bg-white text-stone-900 border-white' : 'bg-transparent text-stone-400 border-stone-800 hover:border-stone-600'}`}>
                               <span>16:9</span>
                               <span className="w-4 h-2.5 border border-current rounded-sm"></span>
                           </button>
                           <button onClick={() => setVideoAspectRatio('9:16')} className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left flex items-center justify-between ${videoAspectRatio === '9:16' ? 'bg-white text-stone-900 border-white' : 'bg-transparent text-stone-400 border-stone-800 hover:border-stone-600'}`}>
                               <span>9:16</span>
                               <span className="w-2.5 h-4 border border-current rounded-sm"></span>
                           </button>
                       </div>

                       <div className="grid grid-cols-2 gap-3 mb-3">
                           <button onClick={() => setVideoResolution('720p')} className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left flex items-center justify-between ${videoResolution === '720p' ? 'bg-white text-stone-900 border-white' : 'bg-transparent text-stone-400 border-stone-800 hover:border-stone-600'}`}>
                               <span>720p</span>
                               <span className="text-[10px] font-bold">Fast</span>
                           </button>
                           <button onClick={() => setVideoResolution('1080p')} className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all text-left flex items-center justify-between ${videoResolution === '1080p' ? 'bg-white text-stone-900 border-white' : 'bg-transparent text-stone-400 border-stone-800 hover:border-stone-600'}`}>
                               <span>1080p</span>
                               <span className="text-[10px] font-bold">HD</span>
                           </button>
                       </div>

                       <button 
                         onClick={() => setVideoWithSound(!videoWithSound)}
                         className={`w-full px-3 py-2 text-xs font-medium rounded-lg border transition-all flex items-center justify-between ${videoWithSound ? 'bg-indigo-900/30 text-indigo-300 border-indigo-800' : 'bg-transparent text-stone-400 border-stone-800 hover:border-stone-600'}`}
                       >
                           <div className="flex items-center gap-2">
                               {videoWithSound ? (
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                               ) : (
                                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                               )}
                               <span>Generate Sound</span>
                           </div>
                           <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${videoWithSound ? 'bg-indigo-500' : 'bg-stone-700'}`}>
                               <div className={`w-3 h-3 rounded-full bg-white shadow-sm transition-transform ${videoWithSound ? 'translate-x-4' : 'translate-x-0'}`}></div>
                           </div>
                       </button>

                       <div className="relative pt-2">
                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest absolute -top-1 left-0">Variations</label>
                             <select 
                               value={videoCount}
                               onChange={(e) => setVideoCount(Number(e.target.value))}
                               className="w-full bg-black/40 text-white text-xs border border-stone-800 rounded-lg px-3 py-2 mt-4 appearance-none focus:outline-none focus:border-stone-600"
                             >
                                <option value="1">1 Variation</option>
                                <option value="2">2 Variations</option>
                                <option value="3">3 Variations</option>
                                <option value="4">4 Variations</option>
                             </select>
                             <div className="absolute right-3 top-7 pointer-events-none text-stone-500">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></svg>
                             </div>
                       </div>
                   </div>
                </div>

                <div className="p-6 border-t border-stone-800 bg-stone-900">
                   {error && <div className="text-red-400 text-xs p-3 bg-red-900/20 border border-red-900/50 rounded-lg mb-4">{error}</div>}
                   <Button 
                    className="w-full bg-indigo-600 text-white hover:bg-indigo-500 border-none shadow-lg shadow-indigo-900/20" 
                    size="lg"
                    disabled={!videoPrompt || isLoading} 
                    onClick={handleGenerateVideo} 
                    isLoading={isLoading}
                   >
                      Render Sequence
                   </Button>
                </div>
             </div>
             
             <div className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-stone-900 via-stone-950 to-stone-950">
                
                {generatedVideos.length > 0 ? (
                   <div className="flex-1 flex flex-col">
                      <div className="flex-1 p-8 flex items-center justify-center relative">
                         <div className="w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-stone-800 relative group">
                            <video 
                                src={generatedVideos[0].url} 
                                controls 
                                autoPlay 
                                loop
                                className="w-full h-full object-contain" 
                            />
                         </div>
                         <div className="absolute bottom-12 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 backdrop-blur-md rounded-full text-white/70 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10 flex items-center gap-2">
                             {generatedVideos[0].hasSound && <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318 0-3.052.753C.12 9.61 1.5 12 1.5 12s-1.38 2.39.814 3.747c.734.753 1.91.753 3.051.753h1.932l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06zM18.5 12c0-1.774-1.029-3.315-2.5-4.05v8.1c1.471-.735 2.5-2.276 2.5-4.05z"></path></svg>}
                            {generatedVideos[0].prompt.substring(0, 60)}...
                         </div>
                      </div>

                      <div className="h-48 border-t border-stone-800 bg-stone-900/30 backdrop-blur-sm p-6 overflow-x-auto flex items-center gap-6">
                         {generatedVideos.map((vid, idx) => (
                             <div key={vid.id} className="relative flex-shrink-0 w-64 aspect-video bg-black rounded-lg border border-stone-800 overflow-hidden group cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all hover:scale-105" onClick={() => {
                                 const newOrder = [vid, ...generatedVideos.filter(v => v.id !== vid.id)];
                                 setGeneratedVideos(newOrder);
                             }}>
                                <video src={vid.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-white bg-black/50 px-2 py-1 rounded backdrop-blur-md">V.{generatedVideos.length - idx}</span>
                                        {vid.hasSound && <svg className="w-3 h-3 text-white/80" fill="currentColor" viewBox="0 0 24 24"><path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318 0-3.052.753C.12 9.61 1.5 12 1.5 12s-1.38 2.39.814 3.747c.734.753 1.91.753 3.051.753h1.932l4.5 4.5c.944.945 2.56.276 2.56-1.06V4.06z"></path></svg>}
                                    </div>
                                    <button className="p-1.5 bg-white text-black rounded-full opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                    </button>
                                </div>
                             </div>
                         ))}
                      </div>
                   </div>
                ) : (
                   <div className="flex-1 flex flex-col items-center justify-center text-stone-600 p-12">
                      <div className="w-24 h-24 rounded-full border-2 border-stone-800 flex items-center justify-center mb-6 animate-pulse">
                          <svg className="w-10 h-10 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                      </div>
                      <h3 className="text-2xl font-serif text-stone-400 mb-2">Studio Empty</h3>
                      <p className="max-w-md text-center text-stone-600">Enter a prompt in the Motion Lab sidebar to begin rendering cinematic assets using the Veo model.</p>
                   </div>
                )}
             </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="font-sans text-stone-900 bg-[#FDFBF7] min-h-screen selection:bg-stone-900 selection:text-white">
      {renderContent()}
    </div>
  );
}