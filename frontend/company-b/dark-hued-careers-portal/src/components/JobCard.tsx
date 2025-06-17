import { Job } from '@/services/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Briefcase, Clock, IndianRupee, DollarSign, Users, Bookmark, BookmarkCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface JobCardProps {
  job: Job;
  onClick: () => void;
}

export const JobCard = ({ job, onClick }: JobCardProps) => {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    // Here you could also save to localStorage or make an API call
    const bookmarks = JSON.parse(localStorage.getItem('jobBookmarks') || '[]');
    if (isBookmarked) {
      const updated = bookmarks.filter((id: string) => id !== job.jobId);
      localStorage.setItem('jobBookmarks', JSON.stringify(updated));
    } else {
      bookmarks.push(job.jobId);
      localStorage.setItem('jobBookmarks', JSON.stringify(bookmarks));
    }
  };

  const formatSalary = (amount: number, currency: string, frequency: string) => {
    return `${currency}${amount.toLocaleString()}/${frequency}`;
  };

  // Defensive checks to prevent undefined errors
  if (!job || !job.company || !job.location || !job.salary || !job.requirements) {
    console.warn('Invalid job data:', job);
    return null;
  }

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border border-border bg-card"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-2">
              {job.title}
            </h3>
            <p className="text-primary font-medium mb-2">{job.company.name}</p>
            <div className="flex items-center text-muted-foreground text-sm mb-2">
              <MapPin className="h-4 w-4 mr-1" />
              <span>{job.location.city}, {job.location.state}</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBookmark}
            className="p-2 h-auto"
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 text-primary" />
            ) : (
              <Bookmark className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-green-600 font-semibold">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>{formatSalary(job.salary.amount, job.salary.currency, job.salary.frequency)}</span>
            </div>
            <div className="flex items-center text-muted-foreground text-sm">
              <Clock className="h-4 w-4 mr-1" />
              <span>{job.jobType}</span>
            </div>
          </div>
          
          <div className="flex items-center text-muted-foreground text-sm">
            <Users className="h-4 w-4 mr-1" />
            <span>{job.requirements.experienceInYears}+ years experience</span>
          </div>
          
          <p className="text-muted-foreground text-sm line-clamp-2">
            {job.description}
          </p>
          
          {job.requirements.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {job.requirements.skills.slice(0, 3).map((skill, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
              {job.requirements.skills.length > 3 && (
                <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-full">
                  +{job.requirements.skills.length - 3} more
                </span>
              )}
            </div>
          )}
          
          <div className="pt-2 border-t border-border">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Posted: {new Date(job.postedDate).toLocaleDateString()}</span>
              <span className="text-primary">View Details →</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JobCard;
