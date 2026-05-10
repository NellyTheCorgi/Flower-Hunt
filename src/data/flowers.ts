import { Flower, Star } from 'lucide-react';

export interface FlowerSpecies {
  id: string;
  name: string;
  scientificName: string;
  family?: string;
  rarity: 'common' | 'rare' | 'ghost' | 'unknown';
  description: string;
  habitat: string;
  icon: 'Flower' | 'Star';
  image?: string;
  formattedText?: string;
}

export const NORWEGIAN_FLOWERS: FlowerSpecies[] = [
  {
    id: 'hvitveis',
    name: 'Hvitveis',
    scientificName: 'Anemone nemorosa',
    family: 'Soleiefamilien',
    rarity: 'common',
    description: 'Kjent vårblomst med hvite kronblad som ofte dekker skogbunnen om våren.',
    habitat: 'Løvskog og blandingsskog',
    icon: 'Flower',
    image: '/blomster_billeder/Hvitveis.JPG'
  },
  {
    id: 'blaveis',
    name: 'Blåveis',
    scientificName: 'Hepatica nobilis',
    family: 'Soleiefamilien',
    rarity: 'common',
    description: 'Tidlig vårblomst med karakteristiske blå kronblader og treflikede blader.',
    habitat: 'Kalkrik løvskog og kratt',
    icon: 'Flower',
    image: '/blomster_billeder/Blåveis.JPG'
  },
  {
    id: 'hestehov',
    name: 'Hestehov',
    scientificName: 'Tussilago farfara',
    family: 'Kurvplantefamilien',
    rarity: 'common',
    description: 'Gule blomster som spretter opp svært tidlig på våren.',
    habitat: 'Veikanter og leirete jord',
    icon: 'Flower',
    image: '/blomster_billeder/Hestehov.jpg'
  },
  {
    id: 'lovetann',
    name: 'Løvetann',
    scientificName: 'Taraxacum officinale',
    family: 'Kurvplantefamilien',
    rarity: 'common',
    description: 'Meget vanlig og hardfør plante med kraftig gul blomst.',
    habitat: 'Plen, grøfter og kulturmark',
    icon: 'Flower',
    image: '/blomster_billeder/Løvetann.jpg'
  },
  {
    id: 'solsikke',
    name: 'Solsikke',
    scientificName: 'Helianthus annuus',
    family: 'Kurvplantefamilien',
    rarity: 'common',
    description: 'En stor og velkjent plante som ofte dyrkes for sine frø og for pryd.',
    habitat: 'Kulturmark, hager og avfallsplasser',
    icon: 'Flower',
    image: '/blomster_billeder/Solsikke.jpg'
  },
  {
    id: 'blaklokke',
    name: 'Blåklokke',
    scientificName: 'Campanula rotundifolia',
    family: 'Klokkefamilien',
    rarity: 'common',
    description: 'En av våre mest folkekjære blomster med sine blå, klokkeformede blomster.',
    habitat: 'Tørre bakker, enger og hei',
    icon: 'Flower',
    image: '/blomster_billeder/Blåklokke.jpg'
  },
  {
    id: 'prestekrage',
    name: 'Prestekrage',
    scientificName: 'Leucanthemum vulgare',
    family: 'Kurvplantefamilien',
    rarity: 'common',
    description: 'Klassisk engblomst med hvite randkroner og gul midt.',
    habitat: 'Enger, veikanter og tørre bakker',
    icon: 'Flower',
    image: '/blomster_billeder/Prestekrage.jpg'
  },
  {
    id: 'rodklover',
    name: 'Rødkløver',
    scientificName: 'Trifolium pratense',
    family: 'Erteblomstfamilien',
    rarity: 'common',
    description: 'En kjent og kjær blomst som ofte finnes på enger og langs veikanter.',
    habitat: 'Enger, beitemark og veikanter',
    icon: 'Flower',
    image: '/blomster_billeder/Rodklover.jpg'
  },
  {
    id: 'engsoleie',
    name: 'Engsoleie',
    scientificName: 'Ranunculus acris',
    family: 'Soleiefamilien',
    rarity: 'common',
    description: 'Den velkjente smørblomsten med sterkt gule kronblader.',
    habitat: 'Enger, beitemark og veikanter',
    icon: 'Flower',
    image: '/blomster_billeder/Engsoleie.jpg'
  },
  {
    id: 'markjordbar',
    name: 'Markjordbær',
    scientificName: 'Fragaria vesca',
    family: 'Rosefamilien',
    rarity: 'common',
    description: 'Små, velsmakende bær og hvite blomster.',
    habitat: 'Skogbryn, veikanter og enger',
    icon: 'Flower',
    image: '/blomster_billeder/Markjordbar.jpg'
  }
];
