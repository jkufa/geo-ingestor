export interface Body {
  ip: string;
  domain: string;
}

export interface GeoResponse {
  visitor_id: string,
  domain: string,
  continent?: string,
  country?: string,
  location?: string,
  subdivisions?: string[];
}

export interface GeoData {
  city:         City;
  continent:    Continent;
  country:      Country;
  location:     Location;
  subdivisions: Subdivision[];
}

interface City {
  names: Names;
}

type Subdivision = City;

interface Names {
  en:      string;
  de?:      string;
  es?:      string;
  fa?:      string;
  fr?:      string;
  ja?:      string;
  ko?:      string;
  "pt-BR"?: string;
  ru?:      string;
  "zh-CN"?: string;
}

interface Continent {
  code:       string;
  geoname_id: number;
  names:      Names;
}

interface Country {
  geoname_id:           number;
  is_in_european_union: boolean;
  iso_code:             string;
  names:                Names;
}

interface Location {
  latitude:  number;
  longitude: number;
}
